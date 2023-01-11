import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ar" dir="rtl" className="bg-rose-400 ">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"></link>
        <meta name="theme-color" content="#fb7185" />
        <meta
          name="description"
          content="Powered by paradise-code created by alimortazavi.org"
        ></meta>
        <meta name="author" content="alimortazavi.org"></meta>
      </Head>
      <body className="bg-rose-400 ">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
