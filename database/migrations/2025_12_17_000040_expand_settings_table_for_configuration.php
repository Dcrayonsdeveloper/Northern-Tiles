<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('group')->nullable()->after('key');
            $table->longText('value_text')->nullable()->after('group');
            $table->json('value_json')->nullable()->after('value_text');
            $table->string('value_file')->nullable()->after('value_json');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['group', 'value_text', 'value_json', 'value_file']);
        });
    }
};
