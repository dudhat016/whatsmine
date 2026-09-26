<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AutomationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $emailSubject,
        public readonly string $emailBody,
        public readonly ?string $fromName = null,
        public readonly ?string $fromEmail = null,
        public readonly ?string $preheader = null,
        public readonly array $cc = [],
        public readonly array $bcc = [],
    ) {}

    public function envelope(): Envelope
    {
        $from = null;
        if (! empty($this->fromEmail) && filter_var($this->fromEmail, FILTER_VALIDATE_EMAIL)) {
            $from = new Address($this->fromEmail, $this->fromName ?? '');
        }

        $ccList = array_values(array_filter($this->cc, fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL)));
        $bccList = array_values(array_filter($this->bcc, fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL)));

        return new Envelope(
            subject: $this->emailSubject,
            from: $from,
            cc: ! empty($ccList) ? $ccList : null,
            bcc: ! empty($bccList) ? $bccList : null,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.automation-email',
            with: [
                'emailBody' => $this->emailBody,
                'preheader' => $this->preheader,
            ]
        );
    }
}
