<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->boolean('is_mega')->default(false)->after('is_active');
            $table->unsignedTinyInteger('mega_columns')->default(4)->after('is_mega');
            $table->string('image_url', 500)->nullable()->after('mega_columns');
            $table->string('image_alt', 191)->nullable()->after('image_url');
            $table->string('video_url', 500)->nullable()->after('image_alt');
            $table->string('badge_text', 50)->nullable()->after('video_url');
            $table->string('badge_color', 20)->nullable()->after('badge_text');
            $table->text('description')->nullable()->after('badge_color');
            $table->json('featured_content')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn([
                'is_mega',
                'mega_columns',
                'image_url',
                'image_alt',
                'video_url',
                'badge_text',
                'badge_color',
                'description',
                'featured_content',
            ]);
        });
    }
};
