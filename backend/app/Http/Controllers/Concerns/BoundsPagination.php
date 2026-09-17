<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

trait BoundsPagination
{
    protected function perPage(Request $request, int $default = 15, int $max = 100): int
    {
        $perPage = (int) $request->input('per_page', $default);

        if ($perPage < 1) {
            return $default;
        }

        return min($perPage, $max);
    }
}
