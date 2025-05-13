import Head from 'next/head'

export default function PageHead({ headTitle }) {
    return (
        <>
            <Head>
                <title>
                    {headTitle ? headTitle : "Jobbox Dashboard - Job Portal HTML Template"}
                </title>
                <link rel="shortcut icon" href="/assets/imgs/template/favicon.svg" />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>
        </>
    )
}
