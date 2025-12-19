<?php

namespace Database\Seeders;

use App\Domain\Auth\Models\Permission;
use App\Domain\Auth\Models\Role;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'View Products', 'slug' => 'products.view', 'group' => 'catalog'],
            ['name' => 'Create Products', 'slug' => 'products.create', 'group' => 'catalog'],
            ['name' => 'Update Products', 'slug' => 'products.update', 'group' => 'catalog'],
            ['name' => 'Delete Products', 'slug' => 'products.delete', 'group' => 'catalog'],
            ['name' => 'View Categories', 'slug' => 'categories.view', 'group' => 'catalog'],
            ['name' => 'Manage Categories', 'slug' => 'categories.manage', 'group' => 'catalog'],
            ['name' => 'View Orders', 'slug' => 'orders.view', 'group' => 'orders'],
            ['name' => 'Update Orders', 'slug' => 'orders.update', 'group' => 'orders'],
            ['name' => 'Cancel Orders', 'slug' => 'orders.cancel', 'group' => 'orders'],
            ['name' => 'Refund Orders', 'slug' => 'orders.refund', 'group' => 'orders'],
            ['name' => 'View Pages', 'slug' => 'pages.view', 'group' => 'cms'],
            ['name' => 'Create Pages', 'slug' => 'pages.create', 'group' => 'cms'],
            ['name' => 'Update Pages', 'slug' => 'pages.update', 'group' => 'cms'],
            ['name' => 'Delete Pages', 'slug' => 'pages.delete', 'group' => 'cms'],
            ['name' => 'Publish Pages', 'slug' => 'pages.publish', 'group' => 'cms'],
            ['name' => 'View Posts', 'slug' => 'posts.view', 'group' => 'cms'],
            ['name' => 'Create Posts', 'slug' => 'posts.create', 'group' => 'cms'],
            ['name' => 'Update Posts', 'slug' => 'posts.update', 'group' => 'cms'],
            ['name' => 'Delete Posts', 'slug' => 'posts.delete', 'group' => 'cms'],
            ['name' => 'Publish Posts', 'slug' => 'posts.publish', 'group' => 'cms'],
            ['name' => 'View Authors', 'slug' => 'authors.view', 'group' => 'cms'],
            ['name' => 'Manage Authors', 'slug' => 'authors.manage', 'group' => 'cms'],
            ['name' => 'View Users', 'slug' => 'users.view', 'group' => 'users'],
            ['name' => 'Manage Users', 'slug' => 'users.manage', 'group' => 'users'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage', 'group' => 'users'],
            ['name' => 'Manage Settings', 'slug' => 'settings.manage', 'group' => 'settings'],
            ['name' => 'Manage Dictionary', 'slug' => 'dictionary.manage', 'group' => 'settings'],
            ['name' => 'Manage Menus', 'slug' => 'menus.manage', 'group' => 'settings'],
            ['name' => 'Manage SEO', 'slug' => 'seo.manage', 'group' => 'seo'],
            ['name' => 'View Analytics', 'slug' => 'analytics.view', 'group' => 'analytics'],
            ['name' => 'Manage Marketing', 'slug' => 'marketing.manage', 'group' => 'marketing'],
        ];

        foreach ($permissions as $permData) {
            Permission::firstOrCreate(
                ['slug' => $permData['slug']],
                $permData
            );
        }

        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Full system access']
        );

        $adminRole->permissions()->sync(Permission::pluck('id'));

        $editorRole = Role::firstOrCreate(
            ['slug' => 'editor'],
            ['name' => 'Editor', 'description' => 'Content management access']
        );

        $editorPermissions = Permission::whereIn('group', ['cms', 'catalog'])
            ->where('slug', 'not like', '%delete%')
            ->pluck('id');
        $editorRole->permissions()->sync($editorPermissions);

        $sellerRole = Role::firstOrCreate(
            ['slug' => 'seller'],
            ['name' => 'Seller', 'description' => 'Seller dashboard access']
        );

        $sellerPermissions = Permission::whereIn('slug', [
            'products.view', 'products.create', 'products.update',
            'orders.view', 'orders.update',
            'analytics.view',
        ])->pluck('id');
        $sellerRole->permissions()->sync($sellerPermissions);
    }
}
