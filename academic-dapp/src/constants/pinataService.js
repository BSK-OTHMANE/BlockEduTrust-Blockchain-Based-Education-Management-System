const PINATA_BASE_URL = "https://api.pinata.cloud";

/*
 ⚠️ Academic prototype
 Frontend keys are acceptable for now
*/
const PINATA_API_KEY = "e3256f1e206935f5d9a2";
const PINATA_SECRET_KEY = "778f5b0ff90810f064916ea5bd56af7b81b6414c0e4643ed2abadb37772ed756";

/* ============================
      UPLOAD FILE TO PINATA
============================ */
export async function uploadFileToPinata(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
    {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY
      },
      body: formData
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Pinata upload failed: " + text);
  }

  const data = await res.json();
  return data.IpfsHash; // CID
}
