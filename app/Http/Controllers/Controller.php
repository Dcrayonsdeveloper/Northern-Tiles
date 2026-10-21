<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    // The Laravel 11 skeleton dropped this trait from the base controller, but
    // the CMS page and post Publish/Unpublish actions call $this->authorize(),
    // which therefore threw — a 500 instead of a publish.
    use AuthorizesRequests;
}
