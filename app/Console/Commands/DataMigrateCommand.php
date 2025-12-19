<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DataMigrateCommand extends Command
{
    protected $signature = 'app:data-migrate {--force : Run in production}';
    protected $description = 'Run idempotent data migrations';

    private array $migrations = [
        // Add data migrations here: 'name' => 'method_name'
        // '001_seed_initial_products' => 'seedInitialProducts',
    ];

    public function handle(): int
    {
        if (app()->isProduction() && !$this->option('force')) {
            $this->error('Use --force in production');
            return 1;
        }

        $this->ensureTable();

        foreach ($this->migrations as $name => $method) {
            if ($this->hasRun($name)) {
                $this->line("Skip: $name (already applied)");
                continue;
            }

            $this->info("Running: $name");

            try {
                DB::beginTransaction();
                $this->$method();
                $this->markComplete($name);
                DB::commit();
                $this->info("Done: $name");
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("Failed: $name - {$e->getMessage()}");
                return 1;
            }
        }

        $this->info('All data migrations complete');
        return 0;
    }

    private function ensureTable(): void
    {
        if (!Schema::hasTable('data_migrations')) {
            Schema::create('data_migrations', function ($table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('status')->default('completed');
                $table->timestamp('ran_at')->useCurrent();
            });
        }
    }

    private function hasRun(string $name): bool
    {
        return DB::table('data_migrations')->where('name', $name)->exists();
    }

    private function markComplete(string $name): void
    {
        DB::table('data_migrations')->insert([
            'name' => $name,
            'status' => 'completed',
            'ran_at' => now(),
        ]);
    }

    // Example migration method:
    // private function seedInitialProducts(): void
    // {
    //     // Idempotent: check before insert
    //     if (Product::count() === 0) {
    //         Product::insert([...]);
    //     }
    // }
}
