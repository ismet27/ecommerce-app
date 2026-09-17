<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('business_id');
            $table->string('product_name_snapshot');
            $table->decimal('unit_price_snapshot', 10, 2);
            $table->integer('quantity');
            $table->decimal('line_total', 10, 2);
            $table->string('status', 20)->default('received');
            $table->timestamps();

            $table->index('order_id');
            $table->index('product_id');
            $table->index('business_id');

            $table->foreign('order_id')
                ->references('id')->on('orders')
                ->onDelete('no action')
                ->onUpdate('no action');

            $table->foreign('product_id')
                ->references('id')->on('products')
                ->onDelete('no action')
                ->onUpdate('no action');

            $table->foreign('business_id')
                ->references('id')->on('businesses')
                ->onDelete('no action')
                ->onUpdate('no action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
