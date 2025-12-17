<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dashboard_widgets', function (Blueprint $table) {
            if (!Schema::hasColumn('dashboard_widgets', 'config_json')) {
                $table->json('config_json')->nullable()->after('description_key');
            }
            if (!Schema::hasColumn('dashboard_widgets', 'default_size')) {
                $table->string('default_size', 20)->default('medium')->after('config_json');
            }
            if (!Schema::hasColumn('dashboard_widgets', 'min_role')) {
                $table->string('min_role', 50)->nullable()->after('default_size');
            }
            if (!Schema::hasColumn('dashboard_widgets', 'component_name')) {
                $table->string('component_name', 100)->nullable()->after('min_role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dashboard_widgets', function (Blueprint $table) {
            $columns = ['config_json', 'default_size', 'min_role', 'component_name'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('dashboard_widgets', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
