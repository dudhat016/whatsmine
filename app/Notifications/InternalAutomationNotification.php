<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InternalAutomationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $subject,
        public readonly string $body,
        public readonly array $extra = []
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject)
            ->line($this->body);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'internal_automation_alert',
            'title' => $this->subject,
            'body' => $this->body,
            'extra' => $this->extra,
        ];
    }
}
