<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - Order {{ $order->order_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #222;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #138ee9;
        }
        .logo span {
            color: #222;
        }
        .receipt-title {
            text-align: right;
        }
        .receipt-title h1 {
            font-size: 28px;
            font-weight: 600;
            color: #222;
            margin-bottom: 5px;
        }
        .order-number {
            font-family: monospace;
            font-size: 16px;
            color: #666;
        }
        .order-date {
            font-size: 13px;
            color: #888;
            margin-top: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .info-section p {
            margin: 3px 0;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background: #f5f5f5;
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
            border-bottom: 2px solid #ddd;
        }
        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }
        .items-table .text-right {
            text-align: right;
        }
        .items-table .product-name {
            font-weight: 500;
        }
        .items-table .sku {
            font-size: 12px;
            color: #888;
            font-family: monospace;
        }
        .items-table .sample-badge {
            display: inline-block;
            background: #d1fae5;
            color: #065f46;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 8px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .totals {
            width: 300px;
            margin-left: auto;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .totals-row.total {
            border-bottom: none;
            border-top: 2px solid #222;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: 600;
        }
        .totals-label {
            color: #666;
        }
        .totals-value {
            font-weight: 500;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #888;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .status-shipped { background: #e0e7ff; color: #3730a3; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-refunded { background: #f3f4f6; color: #374151; }
        
        @media print {
            body {
                padding: 20px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #138ee9; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            🖨️ Print Receipt
        </button>
    </div>

    <div class="header">
        <div class="logo">
            NORTHERN <span>TILE</span>
            <div style="font-size: 11px; color: #888; font-weight: normal; margin-top: 5px;">
                Distributors
            </div>
        </div>
        <div class="receipt-title">
            <h1>RECEIPT</h1>
            <div class="order-number">{{ $order->order_number }}</div>
            <div class="order-date">{{ $order->created_at->format('d M Y, h:i A') }}</div>
            <div style="margin-top: 10px;">
                <span class="status-badge status-{{ $order->status }}">{{ $order->status }}</span>
            </div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h3>Bill To</h3>
            <p><strong>{{ $order->customer_name }}</strong></p>
            <p>{{ $order->customer_email }}</p>
            @if($order->customer_phone)
                <p>{{ $order->customer_phone }}</p>
            @endif
        </div>
        <div class="info-section">
            <h3>Ship To</h3>
            @if($order->shipping_address)
                @php $addr = is_array($order->shipping_address) ? $order->shipping_address : json_decode($order->shipping_address, true); @endphp
                <p><strong>{{ $addr['name'] ?? $order->customer_name }}</strong></p>
                <p>{{ $addr['address_line_1'] ?? '' }}</p>
                @if(!empty($addr['address_line_2']))
                    <p>{{ $addr['address_line_2'] }}</p>
                @endif
                <p>{{ $addr['city'] ?? '' }}, {{ $addr['state'] ?? '' }} {{ $addr['postal_code'] ?? '' }}</p>
                <p>{{ $addr['country'] ?? 'Australia' }}</p>
            @else
                <p>—</p>
            @endif
        </div>
    </div>

    <div class="info-grid">
        <div class="info-section">
            <h3>Payment</h3>
            <p><strong>Method:</strong> {{ ucfirst($order->payment_method ?? 'N/A') }}</p>
            <p><strong>Status:</strong> {{ ucfirst($order->payment_status ?? 'Pending') }}</p>
        </div>
        <div class="info-section">
            <h3>Shipping</h3>
            <p><strong>Method:</strong> {{ ucfirst($order->shipping_method ?? 'Standard') }}</p>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Item</th>
                <th class="text-right">Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
                <tr>
                    <td>
                        <div class="product-name">
                            {{ $item->name }}
                            @if($item->is_sample)
                                <span class="sample-badge">Sample</span>
                            @endif
                        </div>
                        @if($item->sku)
                            <div class="sku">SKU: {{ $item->sku }}</div>
                        @endif
                    </td>
                    <td class="text-right">
                        @if($item->is_sample)
                            <span style="color: #059669;">FREE</span>
                        @else
                            ${{ number_format($item->price, 2) }}
                        @endif
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">
                        @if($item->is_sample)
                            <span style="color: #059669;">FREE</span>
                        @else
                            ${{ number_format($item->line_total, 2) }}
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-row">
            <span class="totals-label">Subtotal</span>
            <span class="totals-value">${{ number_format($order->subtotal, 2) }}</span>
        </div>
        @if($order->discount > 0)
            <div class="totals-row">
                <span class="totals-label">Discount</span>
                <span class="totals-value" style="color: #059669;">-${{ number_format($order->discount, 2) }}</span>
            </div>
        @endif
        <div class="totals-row">
            <span class="totals-label">Shipping</span>
            <span class="totals-value">
                @if($order->shipping_cost > 0)
                    ${{ number_format($order->shipping_cost, 2) }}
                @else
                    FREE
                @endif
            </span>
        </div>
        @if($order->tax > 0)
            <div class="totals-row">
                <span class="totals-label">Tax</span>
                <span class="totals-value">${{ number_format($order->tax, 2) }}</span>
            </div>
        @endif
        <div class="totals-row total">
            <span class="totals-label">Total</span>
            <span class="totals-value">${{ number_format($order->total, 2) }} AUD</span>
        </div>
    </div>

    @if($order->notes)
        <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px;">Order Notes</h3>
            <p>{{ $order->notes }}</p>
        </div>
    @endif

    <div class="footer">
        <p><strong>Northern Tile Distributors</strong></p>
        <p>Thank you for your order!</p>
        <p style="margin-top: 10px;">
            📞 (03) 9464 6623 &nbsp;|&nbsp; ✉️ info@ntiled.com.au
        </p>
    </div>
</body>
</html>
