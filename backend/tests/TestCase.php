<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Reseed the demo dataset after the one-time migrate:fresh that
     * RefreshDatabase performs at the start of the test run.
     */
    protected bool $seed = true;
}
