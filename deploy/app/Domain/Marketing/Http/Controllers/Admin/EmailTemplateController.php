<?php

namespace App\Domain\Marketing\Http\Controllers\Admin;

use App\Domain\Marketing\Models\EmailTemplate;
use App\Domain\Marketing\Services\AbandonedCartMailerService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'type']);

        $query = EmailTemplate::query()
            ->orderBy('type')
            ->orderBy('key');

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('key', 'like', "%{$filters['search']}%")
                    ->orWhere('subject', 'like', "%{$filters['search']}%");
            });
        }

        $templates = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/EmailTemplates/Index', [
            'templates' => $templates,
            'filters' => $filters,
            'types' => EmailTemplate::getTypes(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/EmailTemplates/Create', [
            'template' => null,
            'types' => EmailTemplate::getTypes(),
            'variables' => EmailTemplate::ABANDONED_CART_VARIABLES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:email_templates,key'],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'preview_text' => ['nullable', 'string', 'max:255'],
            'body_json' => ['nullable', 'array'],
            'body_html' => ['nullable', 'string'],
            'type' => ['required', 'in:transactional,marketing,abandoned_cart,notification'],
            'is_active' => ['boolean'],
        ]);

        $validated['available_variables'] = $this->getVariablesForType($validated['type']);

        EmailTemplate::create($validated);

        return redirect()
            ->route('admin.email-templates.index')
            ->with('success', 'Email template created successfully.');
    }

    public function edit(EmailTemplate $emailTemplate): Response
    {
        return Inertia::render('Admin/EmailTemplates/Edit', [
            'template' => $emailTemplate,
            'types' => EmailTemplate::getTypes(),
            'variables' => $this->getVariablesForType($emailTemplate->type),
        ]);
    }

    public function update(Request $request, EmailTemplate $emailTemplate): RedirectResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:email_templates,key,' . $emailTemplate->id],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'preview_text' => ['nullable', 'string', 'max:255'],
            'body_json' => ['nullable', 'array'],
            'body_html' => ['nullable', 'string'],
            'type' => ['required', 'in:transactional,marketing,abandoned_cart,notification'],
            'is_active' => ['boolean'],
        ]);

        $emailTemplate->update($validated);

        return back()->with('success', 'Email template updated successfully.');
    }

    public function destroy(EmailTemplate $emailTemplate): RedirectResponse
    {
        $emailTemplate->delete();

        return redirect()
            ->route('admin.email-templates.index')
            ->with('success', 'Email template deleted successfully.');
    }

    public function preview(EmailTemplate $emailTemplate): Response
    {
        $sampleData = [
            'brand_name' => config('app.name'),
            'customer_email' => 'customer@example.com',
            'customer_name' => 'John Doe',
            'cart_url' => url('/cart/recover/sample-token'),
            'cart_items' => '<p>Sample cart items</p>',
            'cart_items_count' => 3,
            'cart_total' => '99.99',
            'unsubscribe_url' => url('/unsubscribe/sample-token'),
        ];

        $renderedHtml = $emailTemplate->render($sampleData);
        $renderedSubject = $emailTemplate->renderSubject($sampleData);

        return Inertia::render('Admin/EmailTemplates/Preview', [
            'template' => $emailTemplate,
            'renderedHtml' => $renderedHtml,
            'renderedSubject' => $renderedSubject,
        ]);
    }

    public function sendTest(Request $request, EmailTemplate $emailTemplate, AbandonedCartMailerService $mailerService): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $success = $mailerService->sendTestEmail($request->email, $emailTemplate);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Test email sent successfully.' : 'Failed to send test email.',
        ]);
    }

    public function duplicate(EmailTemplate $emailTemplate): RedirectResponse
    {
        $newTemplate = $emailTemplate->replicate();
        $newTemplate->key = $emailTemplate->key . '_copy_' . time();
        $newTemplate->name = $emailTemplate->name . ' (Copy)';
        $newTemplate->save();

        return redirect()
            ->route('admin.email-templates.edit', $newTemplate)
            ->with('success', 'Template duplicated successfully.');
    }

    protected function getVariablesForType(string $type): array
    {
        return match ($type) {
            'abandoned_cart' => EmailTemplate::ABANDONED_CART_VARIABLES,
            default => [
                '{{brand_name}}' => 'Your brand name',
                '{{customer_email}}' => 'Customer email',
                '{{customer_name}}' => 'Customer name',
            ],
        };
    }
}
