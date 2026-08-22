<?php

namespace App\Modules\Funnels\Events;

use App\Modules\Funnels\Models\SubscriptionForm;
use App\Modules\Shared\Models\Contact;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionFormSubmitted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public SubscriptionForm $form;
    public Contact $contact;
    public array $submittedData;

    public function __construct(SubscriptionForm $form, Contact $contact, array $submittedData)
    {
        $this->form = $form;
        $contact->loadMissing('tags');
        $this->contact = $contact;
        $this->submittedData = $submittedData;
    }
}
