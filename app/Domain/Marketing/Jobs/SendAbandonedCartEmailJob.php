<?php

namespace App\Domain\Marketing\Jobs;

use App\Domain\Marketing\Models\AbandonedCartMessage;
use App\Domain\Marketing\Services\AbandonedCartMailerService;
use App\Domain\Marketing\Services\AbandonedCartService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendAbandonedCartEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 120;
    public int $timeout = 60;

    public function __construct(
        protected ?int $messageId = null,
        protected ?int $vendorId = null
    ) {}

    public function handle(
        AbandonedCartService $abandonedCartService,
        AbandonedCartMailerService $mailerService
    ): void {
        if ($this->messageId) {
            // Send specific message
            $message = AbandonedCartMessage::with(['cart', 'flow'])->find($this->messageId);
            if ($message) {
                $mailerService->sendMessage($message);
            }
        } else {
            // Process all ready messages
            $messages = $abandonedCartService->getMessagesReadyToSend($this->vendorId, 50);

            Log::info("Processing {$messages->count()} abandoned cart emails");

            foreach ($messages as $message) {
                // Dispatch individual job for each message for better retry handling
                self::dispatch($message->id)->onQueue('emails');
            }
        }
    }

    public function tags(): array
    {
        $tags = ['abandoned-carts', 'email'];
        if ($this->messageId) {
            $tags[] = 'message-' . $this->messageId;
        }
        return $tags;
    }
}
