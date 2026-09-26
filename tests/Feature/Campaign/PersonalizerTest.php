<?php

namespace Tests\Feature\Campaign;

use App\Modules\Broadcasting\Services\CampaignPersonalizer;
use App\Modules\Shared\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PersonalizerTest extends TestCase
{
    use RefreshDatabase;

    private function makeContact(array $overrides = []): Contact
    {
        $workspace = \App\Models\Workspace::first() ?? \App\Models\Workspace::factory()->create();

        return Contact::factory()->create(array_merge([
            'workspace_id' => $workspace->id,
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'phone_e164' => '+14155552671',
            'email' => 'ada@example.test',
            'country' => 'GB',
        ], $overrides));
    }

    #[Test]
    public function it_substitutes_contact_tokens_in_a_text_body(): void
    {
        $contact = $this->makeContact();
        $personalizer = new CampaignPersonalizer;

        $rendered = $personalizer->renderText(
            'Hi {{contact.first_name}} {{contact.last_name}}, your country: {{contact.country}}.',
            $contact,
        );

        $this->assertSame('Hi Ada Lovelace, your country: GB.', $rendered);
    }

    #[Test]
    public function it_supports_full_name_shorthand(): void
    {
        $contact = $this->makeContact();
        $personalizer = new CampaignPersonalizer;

        $this->assertSame(
            'Hi Ada Lovelace!',
            $personalizer->renderText('Hi {{contact.name}}!', $contact),
        );
    }

    #[Test]
    public function it_substitutes_custom_field_tokens(): void
    {
        $contact = $this->makeContact(['custom_fields' => ['order_id' => 'X-9001']]);
        $personalizer = new CampaignPersonalizer;

        $this->assertSame(
            'Order: X-9001',
            $personalizer->renderText('Order: {{contact.custom.order_id}}', $contact),
        );
    }

    #[Test]
    public function it_substitutes_context_tokens(): void
    {
        $contact = $this->makeContact();
        $personalizer = new CampaignPersonalizer;

        $rendered = $personalizer->renderText(
            'Click {{context.unsubscribe_url}}',
            $contact,
            ['unsubscribe_url' => 'https://x.test/u/abc'],
        );

        $this->assertSame('Click https://x.test/u/abc', $rendered);
    }

    #[Test]
    public function it_renders_meta_template_components_per_recipient(): void
    {
        $contact = $this->makeContact();
        $personalizer = new CampaignPersonalizer;

        // Components in the Meta WhatsApp Cloud API shape, with contact tokens
        // baked into parameter values (the wizard saves them this way).
        $components = [
            [
                'type' => 'header',
                'parameters' => [
                    ['type' => 'text', 'text' => 'Hello {{contact.first_name}}'],
                ],
            ],
            [
                'type' => 'body',
                'parameters' => [
                    ['type' => 'text', 'text' => '{{contact.first_name}}'],
                    ['type' => 'text', 'text' => '{{contact.country}}'],
                ],
            ],
            [
                'type' => 'button',
                'sub_type' => 'url',
                'index' => '0',
                'parameters' => [
                    ['type' => 'text', 'text' => 'tracking-{{contact.phone_e164}}'],
                ],
            ],
        ];

        $rendered = $personalizer->renderTemplateComponents($components, $contact);

        $this->assertSame('Hello Ada', $rendered[0]['parameters'][0]['text']);
        $this->assertSame('Ada', $rendered[1]['parameters'][0]['text']);
        $this->assertSame('GB', $rendered[1]['parameters'][1]['text']);
        $this->assertSame('tracking-+14155552671', $rendered[2]['parameters'][0]['text']);
    }

    #[Test]
    public function it_renders_media_links_with_contact_tokens(): void
    {
        $contact = $this->makeContact();
        $personalizer = new CampaignPersonalizer;

        $components = [
            [
                'type' => 'header',
                'parameters' => [
                    [
                        'type' => 'image',
                        'image' => ['link' => 'https://cdn.test/{{contact.country}}.jpg'],
                    ],
                ],
            ],
        ];

        $rendered = $personalizer->renderTemplateComponents($components, $contact);

        $this->assertSame(
            'https://cdn.test/GB.jpg',
            $rendered[0]['parameters'][0]['image']['link'],
        );
    }

    #[Test]
    public function it_substitutes_tokens_with_fallback_defaults(): void
    {
        $contact = $this->makeContact(['first_name' => '']);
        $personalizer = new CampaignPersonalizer;

        $rendered1 = $personalizer->renderText(
            "Hello {{contact.first_name | default: 'there'}}, welcome!",
            $contact,
        );
        $this->assertSame('Hello there, welcome!', $rendered1);

        $rendered2 = $personalizer->renderText(
            "Hello {{contact.first_name | 'valued customer'}}!",
            $contact,
        );
        $this->assertSame('Hello valued customer!', $rendered2);

        // When value exists, it should use the value and ignore the default
        $contactWithVal = $this->makeContact(['first_name' => 'Michael', 'phone_e164' => '+14155550002']);
        $rendered3 = $personalizer->renderText(
            "Hello {{contact.first_name | default: 'there'}}!",
            $contactWithVal,
        );
        $this->assertSame('Hello Michael!', $rendered3);
    }

    #[Test]
    public function it_substitutes_custom_values_and_trigger_links(): void
    {
        $contact = $this->makeContact();
        $personalizer = new CampaignPersonalizer;

        // Custom Value
        \App\Modules\Shared\Models\CustomValue::create([
            'workspace_id' => $contact->workspace_id,
            'name' => 'Google Review URI',
            'key' => 'google_review_uri',
            'value' => 'https://g.page/r/abc123',
        ]);

        $renderedCv = $personalizer->renderText(
            'Review us at {{custom_values.google_review_uri}}',
            $contact,
        );
        $this->assertSame('Review us at https://g.page/r/abc123', $renderedCv);

        // Trigger Link
        $triggerLink = \App\Modules\Shared\Models\TriggerLink::create([
            'workspace_id' => $contact->workspace_id,
            'name' => 'Feedback Form',
            'target_url' => 'https://example.com/feedback',
            'slug' => 'feedback_form',
        ]);

        $renderedTl = $personalizer->renderText(
            'Give feedback: {{trigger_links.feedback_form}}',
            $contact,
        );
        $this->assertStringContainsString('/l/feedback_form?c=' . $contact->id, $renderedTl);
    }
}
