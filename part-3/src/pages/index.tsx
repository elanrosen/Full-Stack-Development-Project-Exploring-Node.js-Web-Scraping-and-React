import { Main } from "@/components/Main";
import { Container } from "@chakra-ui/react";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Domain Shopping Cart</title>
        <link rel="icon" type="image/x-icon" href="public/favicon.ico"></link>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Container paddingY={12}>
        <Main numDomainsRequired={12} />
      </Container>
    </>
  );
}
