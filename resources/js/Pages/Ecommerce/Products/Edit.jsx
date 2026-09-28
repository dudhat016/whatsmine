import React from 'react';
import { Head, router } from '@inertiajs/react';
import NativeProductBuilder from './Partials/NativeProductBuilder';

export default function ProductEdit({ product, nativeStore, calendars = [], allProducts = [] }) {
    const handleClose = () => {
        router.visit(route('client.ecommerce.products.index'));
    };

    return (
        <>
            <Head title={`Edit ${product?.name || 'Product'} — E-Commerce`} />
            <NativeProductBuilder
                isOpen={true}
                onClose={handleClose}
                product={product}
                calendars={calendars}
                allProducts={allProducts}
                nativeStore={nativeStore}
            />
        </>
    );
}
