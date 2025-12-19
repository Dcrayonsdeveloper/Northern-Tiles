<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abandoned_cart_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('flow_id')->constrained('abandoned_cart_flows')->cascadeOnDelete();
            $table->integer('step')->default(1)->comment('Step number in the flow');
            $table->string('template_key');
            $table->enum('status', ['queued', 'scheduled', 'sent', 'skipped', 'failed', 'cancelled'])->default('queued');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('error_text')->nullable();
            $table->string('message_id')->nullable()->comment('Email provider message ID');
            $table->json('metadata')->nullable()->comment('Additional tracking data');
            $table->timestamps();

            $table->index(['cart_id', 'step']);
            $table->index(['status', 'scheduled_at']);
            $table->index('flow_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abandoned_cart_messages');
    }
};
