<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AgencyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $type, // proposal_viewed, revision_requested, contract_signed, invoice_paid, onboarding_completed
        public string $title,
        public string $message,
        public ?string $actionUrl = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->greeting('Hello ' . ($notifiable->name ?? 'Team') . '!')
            ->line($this->message);

        if ($this->actionUrl) {
            $mail->action('View Details', $this->actionUrl);
        }

        return $mail->line('Thank you for using WhatsMine Agency Suite.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
        ];
    }
}
