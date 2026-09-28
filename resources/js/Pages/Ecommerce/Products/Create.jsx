import React from 'react';
import { Head, router } from '@inertiajs/react';
import NativeProductBuilder from './Partials/NativeProductBuilder';

export default function ProductCreate({ nativeStore, calendars = [], allProducts = [] }) {
    const handleClose = () => {
        router.visit(route('client.ecommerce.products.index'));
    };

    return (
        <>
            <Head title="Create Product — E-Commerce" />
            <NativeProductBuilder
                isOpen={true}
                onClose={handleClose}
                product={null}
                calendars={calendars}
                allProducts={allProducts}
                nativeStore={nativeStore}
            />
        </>
    );
}
