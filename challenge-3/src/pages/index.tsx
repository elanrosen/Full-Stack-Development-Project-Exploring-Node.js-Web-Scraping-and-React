import { Challenge } from "@/components/Challenge";
import { Container } from "@chakra-ui/react";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Challenge 3</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Container paddingY={12}>
        <Challenge numDomainsRequired={12} />
      </Container>
    </>
  );
}
