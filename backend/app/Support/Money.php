<?php

namespace App\Support;

/**
 * Decimal money helpers that avoid repeated floating point multiplication.
 * Each stored decimal price is converted to integer cents exactly once;
 * all further arithmetic (multiplying by an integer quantity, summing line
 * totals) is then done with integers, so no rounding error can accumulate.
 */
class Money
{
    public static function toCents(string|int|float $decimal): int
    {
        return (int) round(((float) $decimal) * 100);
    }

    public static function fromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    public static function lineTotalCents(string|int|float $unitPrice, int $quantity): int
    {
        return self::toCents($unitPrice) * $quantity;
    }
}
