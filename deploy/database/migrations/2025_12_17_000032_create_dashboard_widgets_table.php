<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dashboard_widgets', function (Blueprint $table) {
            $table->id();
            $table->string('widget_key')->unique();
            $table->json('role_scope');
            $table->string('title_key');
            $table->string('description_key')->nullable();
            $table->string('component_view');
            $table->string('permissions')->nullable();
            $table->boolean('default_enabled')->default(true);
            $table->integer('default_sort')->default(100);
            $table->boolean('supports_date_range')->default(false);
            $table->integer('cache_ttl_seconds')->default(300);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_widgets');
    }
};
