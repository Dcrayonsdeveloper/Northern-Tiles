<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactMessageController extends Controller
{
    public function index(): Response
    {
        $messages = ContactMessage::query()
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Messages/Index', [
            'messages' => $messages,
        ]);
    }

    public function show(ContactMessage $message): Response
    {
        if (!$message->is_read) {
            $message->update(['is_read' => true]);
        }

        return Inertia::render('Admin/Messages/Show', [
            'message' => $message,
        ]);
    }

    public function update(Request $request, ContactMessage $message): RedirectResponse
    {
        $validated = $request->validate([
            'is_read' => ['required', 'boolean'],
        ]);

        $message->update(['is_read' => (bool) $validated['is_read']]);

        return redirect()->route('admin.messages.show', $message->id);
    }

    public function destroy(ContactMessage $message): RedirectResponse
    {
        $message->delete();

        return redirect()->route('admin.messages.index');
    }
}
