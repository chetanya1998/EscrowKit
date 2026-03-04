import ClientPage from './client-page';

export function generateStaticParams() {
    return [{ address: '0x0000000000000000000000000000000000000000' }];
}

export default function Page() {
    return <ClientPage />;
}
