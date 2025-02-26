import Head from "next/head";
import Image from "next/image";
import sb from "satoshi-bitcoin";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useCallback, useEffect, useRef, useState } from "react";

import { useInterval } from "../hooks/useInterval";

const inter = Inter({ subsets: ["latin"] });
const MDO_ADDRESS = "DAHkCF5LajV6jYyi5o4eMvtpqXRcm9eZYq";

export default function Home() {
  const [btnText, setBtnText] = useState("Connect");
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(false);
  const [balance, setBalance] = useState(0);
  const [txId, setTxId] = useState("");
  const [inscriptionLocation, setinscriptionLocation] = useState("");
  const [recipientAddress, setRecipientAddress] = useState(MDO_ADDRESS);
  const [drc20Ticker, setDrc20Ticker] = useState("unln");
  const [drc20Available, setDrc20Available] = useState("");
  const [drc20Transferable, setDrc20Transferable] = useState("");
  const [drc20Inscriptions, setDrc20Inscriptions] = useState<any[]>([]);
  const [drc20Amount, setDrc20Amount] = useState("0");
  const [dunesTicker, setDunesTicker] = useState("aabb");
  const [dunesBalance, setDunesBalance] = useState("0");
  const [dunesAmount, setDunesAmount] = useState("0");
  const [rawTx, setRawTx] = useState("");
  const [psbtIndexes, setPsbtIndexes] = useState([1, 2]);
  const [signMessage, setSignMessage] = useState("tomo");
  const [decryptMessage, setDecryptMessage] = useState(
    "IG1xGVGJ2jv27IYjDKtHR+9pQqx+CBNimUfgwhrIGo03DtgEAPGQrhAfJzVylJU/K6i175TNFD4+ZERslTOk4y8=",
  );
  const [myDoge, setMyDoge] = useState<any>();
  const intervalRef = useRef<any>();

  useEffect(() => {
    if (!myDoge) {
      const onInit = () => {
        // const { doge } = window as any;
        const { doge } = window?.mydoge as any;
        setMyDoge(doge);
        window.removeEventListener("doge#initialized", onInit);
        console.log("MyDoge API injected from event");
      };
      window.addEventListener("doge#initialized", onInit, { once: true });
      // return;
    }

    // (async () => {
    //   const connectRes = await myDoge.connect();
    //     console.log('connect result', connectRes);
    //     if (connectRes.approved) {
    //       setConnected(true);
    //       setAddress(connectRes.address);
    //       setBtnText('Disconnect');
    //     }
    // })();
  }, [myDoge]);

  // Handle dev edge case where component mounts after MyDoge is initialized
  useEffect(() => {
    if (!myDoge && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        // const { doge } = window as any;
        const { doge } = window?.mydoge as any;
        if (doge?.isMyDoge) {
          setMyDoge(doge);
          clearInterval(intervalRef.current);
          console.log("MyDoge API injected from interval");
        } else {
          console.log("MyDoge API not injected");
        }
      }, 1000);
    }
  }, [myDoge]);

  const onConnect = useCallback(async () => {
    if (!myDoge?.isMyDoge) {
      alert(`MyDoge not installed!`);
      return;
    }

    try {
      if (connected) {
        const disconnectRes = await myDoge.disconnect();
        console.log("disconnect result", disconnectRes);
        if (disconnectRes.disconnected) {
          setConnected(false);
          setAddress(false);
          setBtnText("Connect");
        }
        return;
      }

      const connectRes = await myDoge.connect();
      console.log("connect result", connectRes);
      if (connectRes.approved) {
        setConnected(true);
        setAddress(connectRes.address);
        setBtnText("Disconnect");
      }
    } catch (e) {
      console.error(e);
    }
  }, [connected, myDoge]);

  const checkConnection = useCallback(async () => {
    if (connected) {
      const connectionStatusRes = await myDoge
        .getConnectionStatus()
        .catch(console.error);
      console.log("getConnectionStatus result", connectionStatusRes);

      if (!connectionStatusRes?.connected) {
        setConnected(false);
        setAddress(false);
        setBtnText("Connect");
      }

      const balanceRes = await myDoge.getBalance();
      console.log("balance result", balanceRes);
      setBalance(balanceRes.balance);
    }
  }, [connected, myDoge]);

  checkConnection();

  // useInterval(checkConnection, 5000, false);

  const isConnected = useCallback(() => {
    if (!myDoge?.isMyDoge) {
      alert(`MyDoge not installed!`);
      return false;
    }

    if (!connected) {
      alert(`MyDoge not connected!`);
      return false;
    }

    return true;
  }, [connected, myDoge]);

  const onSendInscription = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const txReqRes = await myDoge.requestInscriptionTransaction({
        recipientAddress,
        location: inscriptionLocation,
      });
      console.log("request inscription transaction result", txReqRes);
      setTxId(txReqRes.txId);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, recipientAddress, inscriptionLocation]);

  const onGetDRC20Balance = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const balanceRes = await myDoge.getDRC20Balance({
        ticker: drc20Ticker,
      });
      //{availableBalance: '0', transferableBalance: '0', ticker: 'tomo', address: 'DTjdm88aasjstNCfGr1H6jWkbEJN5Y34Ss'}
      console.log("getDRC20Balance result", balanceRes);
      setDrc20Inscriptions([]);
      setDrc20Available(balanceRes.availableBalance);
      setDrc20Transferable(balanceRes.transferableBalance);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, drc20Ticker]);

  const onGetDRC20Inscriptions = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const transferableRes = await myDoge.getTransferableDRC20({
        ticker: drc20Ticker,
      });
      console.log("getTransferableDRC20 result", transferableRes);
      setDrc20Inscriptions(transferableRes.inscriptions);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, drc20Ticker]);

  const onAvailableDRC20 = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const txReqRes = await myDoge.requestAvailableDRC20Transaction({
        ticker: drc20Ticker,
        amount: drc20Amount,
      });
      console.log("request available drc-20 tx result", txReqRes);
      setTxId(txReqRes.txId);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, drc20Ticker, drc20Amount]);

  const onGetDunesBalance = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const balanceRes = await myDoge.getDunesBalance({
        ticker: dunesTicker,
      });
      console.log("getDunesBalance result", balanceRes);

      setDunesBalance(balanceRes.balance);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, dunesTicker]);

  const onSendDunes = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const txReqRes = await myDoge.requestDunesTransaction({
        ticker: dunesTicker,
        recipientAddress,
        amount: dunesAmount,
      });
      console.log("request dunes transaction result", txReqRes);
      setTxId(txReqRes.txId);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, recipientAddress, dunesTicker, dunesAmount]);

  const txStatus = useCallback(async () => {
    if (txId) {
      const txStatusRes = await myDoge.getTransactionStatus({
        txId,
      });
      console.log("transaction status result", txStatusRes);
      // Once confirmed, stop polling and update balance
      if (txStatusRes.status === "confirmed" && txStatusRes.confirmations > 1) {
        const balanceRes = await myDoge.getBalance();
        console.log("balance result", balanceRes);
        // setBalance(sb.toBitcoin(balanceRes.balance || 0));
        setTxId("");
      }
    }
  }, [myDoge, txId]);

  const onSendPSBT = useCallback(async () => {
    if (!isConnected()) return;
    const signOnly = true;

    try {
      const txReqRes = await myDoge.requestPsbt({
        rawTx,
        indexes: psbtIndexes,
        signOnly, // Optionally return the signed transaction instead of broadcasting
      });
      console.log("request send psbt result", txReqRes);

      if (!signOnly) {
        setTxId(txReqRes.txId);
      }
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, psbtIndexes, rawTx]);

  const onSignMessage = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const signMsgRes = await myDoge.requestSignedMessage({
        message: signMessage,
      });
      console.log("request sign message result", signMsgRes);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, signMessage]);

  const onDecryptMessage = useCallback(async () => {
    if (!isConnected()) return;

    try {
      const decryptMsgRes = await myDoge.requestDecryptedMessage({
        message: decryptMessage,
      });
      console.log("request decrypt message result", decryptMsgRes);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, decryptMessage]);

  useInterval(txStatus, 10000, false);

  const onRequestTransaction = useCallback(async () => {
    // if (!isConnected()) return;

    try {
      const res = await myDoge.requestTransaction({
        recipientAddress: "DLsbf5qa5XKXGsMamvLUWeimmMKBnFMV7h",
        dogeAmount: 0.1,
      });
      console.log("requestTransaction result", res);

      setTxId(res.txid);
    } catch (e) {
      console.error(e);
    }
  }, [isConnected, myDoge, decryptMessage]);

  return (
    <>
      <Head>
        <title>MyDoge Test</title>
        <meta name="description" content="Sample integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div className={styles.item}>
          <div>
            <a
              href="https://github.com/mydoge-com/mydogemask"
              target="_blank"
              rel="noopener noreferrer"
            >
              Checkout MyDoge Wallet Browser
              <Image
                src="/github.svg"
                alt="GitHub Logo"
                width={25}
                height={25}
                priority
              />
            </a>
          </div>
        </div>

        <div className={styles.center}>
          <button onClick={onConnect}>{btnText}</button>
        </div>
        {connected && (
          <div className={styles.container}>
            <div className={styles.item}>Address: {address}</div>
            <div className={styles.item}>Balance: {balance}</div>
            --------------------------------------------------------------------
            <h2>Send Inscription</h2>
            <div className={styles.center}>
              Inscription location
              <input
                placeholder="inscriptionLocation: (Doginal/DRC-20) (txid:vout:offset)"
                type="text"
                style={{ width: "385px" }}
                value={inscriptionLocation}
                onChange={(text) => {
                  setinscriptionLocation(text.target.value);
                }}
              />
            </div>
            <div className={styles.center}>
              recipient address
              <input
                type="text"
                style={{ width: "365px" }}
                value={recipientAddress}
                onChange={(text) => {
                  setRecipientAddress(text.target.value);
                }}
              />
            </div>
            <div className={styles.center}>
              <button onClick={onSendInscription}>Send Inscription</button>
            </div>
            --------------------------------------------------------------------
            <div className={styles.center}>DRC-20 Ticker</div>
            <input
              type="text"
              style={{ width: "135px" }}
              value={drc20Ticker}
              onChange={(text) => {
                setDrc20Ticker(text.target.value);
              }}
            />
            <div className={styles.center}>
              <button onClick={onGetDRC20Balance}>Get DRC-20 Balance</button>
            </div>
            {drc20Available && (
              <div className={styles.item}>
                Available Balance: {drc20Available}
              </div>
            )}
            {drc20Transferable && (
              <div className={styles.item}>
                Transferable Balance: {drc20Transferable}
              </div>
            )}
            {drc20Available || drc20Transferable ? (
              <>
                drc20 amount:{" "}
                <input
                  type="text"
                  className={styles.item}
                  style={{ width: "100px" }}
                  value={drc20Amount}
                  onChange={(text) => {
                    setDrc20Amount(text.target.value);
                  }}
                />
              </>
            ) : null}
            {drc20Available && (
              <div className={styles.center}>
                <button onClick={() => onAvailableDRC20()}>
                  Make Transferable
                </button>
              </div>
            )}
            {true && (
              <div className={styles.center}>
                <button onClick={() => onGetDRC20Inscriptions()}>
                  Get Transferable DRC-20
                </button>
              </div>
            )}
            {drc20Inscriptions.length > 0 &&
              (drc20Inscriptions as any[]).map((inscription) => (
                <div key={inscription.location}>
                  {inscription.location} {inscription.ticker}{" "}
                  {inscription.amount}
                </div>
              ))}
            --------------------------------------------------------------------
            <h2>Dunes Ticker</h2>
            <input
              type="text"
              style={{ width: "130px" }}
              value={dunesTicker}
              onChange={(text) => {
                setDunesTicker(text.target.value);
              }}
            />
            <div className={styles.center}>
              <button onClick={onGetDunesBalance}>Get Dunes Balance</button>
            </div>
            {dunesBalance && (
              <div className={styles.container}>
                <div className={styles.item}>Dunes Balance: {dunesBalance}</div>
                <div className={styles.item}>
                  Dunes Recipient Address
                  <input
                    className={styles.item}
                    type="text"
                    style={{ width: "265px" }}
                    value={recipientAddress}
                    onChange={(text) => {
                      setRecipientAddress(text.target.value);
                    }}
                  />
                </div>
                <div className={styles.item}>
                  Dunes Amount
                  <input
                    type="text"
                    className={styles.item}
                    style={{ width: "100px" }}
                    value={dunesAmount}
                    onChange={(text) => {
                      setDunesAmount(text.target.value);
                    }}
                  />
                </div>
                <button className={styles.item} onClick={onSendDunes}>
                  Send Dunes
                </button>
              </div>
            )}
            --------------------------------------------------------------------
            <h2 className={styles.item}>Send PSBT</h2>
            <div className={styles.item}>
              Raw TX
              <input
                type="text"
                className={styles.item}
                style={{ width: "500px" }}
                value={rawTx}
                onChange={(text) => {
                  setRawTx(text.target.value);
                }}
              />
            </div>
            <div className={styles.item}>
              Input Indexes (csv)
              <input
                type="text"
                className={styles.item}
                style={{ width: "150px" }}
                value={psbtIndexes.join(",")}
                onChange={(text) => {
                  if (text?.target?.value) {
                    const indexes = text.target.value.split(",").map(Number);
                    setPsbtIndexes(indexes);
                  }
                }}
              />
            </div>
            <div className={styles.center}>
              <button onClick={() => onSendPSBT()}>Send PSBT</button>
            </div>
            --------------------------------------------------------------------
            <h2 className={styles.item}>Sign Message</h2>
            Message:{" "}
            <input
              type="text"
              className={styles.item}
              style={{ width: "500px" }}
              value={signMessage}
              onChange={(text) => {
                setSignMessage(text.target.value);
              }}
            />
            <div className={styles.center}>
              <button onClick={() => onSignMessage()}>
                requestSignedMessage
              </button>
            </div>
            --------------------------------------------------------------------
            <h2 className={styles.item}>Decrypt Message</h2>
            decryptMessage{" "}
            <input
              type="text"
              className={styles.item}
              style={{ width: "500px" }}
              value={decryptMessage}
              onChange={(text) => {
                setDecryptMessage(text.target.value);
              }}
            />
            <div className={styles.center}>
              <button onClick={() => onDecryptMessage()}>
                requestDecryptedMessage
              </button>
            </div>
            <div className={styles.center}>
              <button onClick={() => onRequestTransaction()}>
                request Transaction
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
