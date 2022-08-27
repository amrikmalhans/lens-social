import Link from "next/link";
import { apolloClient } from "../apollo-client";
import { gql } from "@apollo/client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { setAuthenticationToken } from "../state";
const query = `
  query {
    ping
  }
`;

const GET_CHALLENGE = gql`
  query ($request: ChallengeRequest!) {
    challenge(request: $request) {
      text
    }
  }
`;

const AUTHENTICATION = gql`
  mutation ($request: SignedAuthChallenge!) {
    authenticate(request: $request) {
      accessToken
      refreshToken
    }
  }
`;

const CREATE_PROFILE = gql`
  mutation ($request: CreateProfileRequest!) {
    createProfile(request: $request) {
      ... on RelayerResult {
        txHash
      }
      ... on RelayError {
        reason
      }
      __typename
    }
  }
`;

const GET_DEFAULT_PROFILES = gql`
  query($request: DefaultProfileRequest!) {
    defaultProfile(request: $request) {
      id
      handle
    }
  }
`;


const IndexPage = () => {
  const [haveMetamask, sethaveMetamask] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState(false);
  const [accountAddress, setAccountAddress] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const generateChallenge = async (address: string): Promise<string> => {
    const { data } = await apolloClient.query({
      query: GET_CHALLENGE,
      variables: {
        request: {
          address,
        },
      },
    });
    return data.challenge.text;
  };

  const authenticate = async (
    address: string,
    signature: string
  ): Promise<boolean> => {
    const { data } = await apolloClient.mutate({
      mutation: AUTHENTICATION,
      variables: {
        request: {
          address,
          signature,
        },
      },
    });

    setAuthenticationToken(data.authenticate.accessToken);

    if (data) return true;
  };

  const createProfileRequest = async (createProfileRequest: {
    handle: string;
    profilePictureUri?: string;
    followNFTURI?: string;
  }) => {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_PROFILE,
      variables: {
        request: createProfileRequest,
      },
     
    });

    console.log(data);
    
  };

  const getDefaultProfile = async (ethereumAddress: string) => {
    const {data} = await apolloClient.query({
      query: GET_DEFAULT_PROFILES,
      variables: {
        request: {
          ethereumAddress,
        },
      },
    });

    console.log(data);
    
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        sethaveMetamask(false);
      }
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setAccountAddress(address);
      setIsConnected(true);
      const text = await generateChallenge(address);

      const signature = await signer.signMessage(text);
      const isLoggedIn = await authenticate(address, signature);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const createProfile = async () => {
     await createProfileRequest({
      handle: "testingforlifebabyyyy",
     })
  }

  const getProfile = async () => {
    await getDefaultProfile(accountAddress);
  }

  useEffect(() => {
    const checkMetamaskAvailability = async () => {
      if (!window.ethereum) {
        sethaveMetamask(false);
      }
      sethaveMetamask(true);
    };
    checkMetamaskAvailability();
  }, []);

  return (
    <>
      <div>
        <h1 className="text-blue-700">hello</h1>
        <button className="btn" onClick={connectWallet}>
          Connect
        </button>
        <br />
        <button className="btn" onClick={createProfile}>
          Create Profile
        </button>

        <br />

        <button onClick={getProfile}>get profile</button>
      </div>
    </>
  );
};

export default IndexPage;

declare global {
  interface Window {
    ethereum?: any;
  }
}
