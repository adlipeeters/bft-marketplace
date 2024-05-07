import React, { useState } from 'react';
import { Row, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import FormData from 'form-data';
import { generateRandomString } from '../utils';
import { ethers } from "ethers"

const JWT = ''

const Pinata = ({ marketplace, nft }) => {
    const [nftData, setNftData] = useState({
        name: '',
        description: '',
        price: '',
        image: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNftData({ ...nftData, [name]: value });
    }

    const uploadToIPFS = async (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const pinataMetadata = JSON.stringify({ name: file.name + (new Date().getTime()) });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({ cidVersion: 0 });
        formData.append('pinataOptions', pinataOptions);

        try {
            const imageResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                maxBodyLength: "Infinity",
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'Authorization': `Bearer ${JWT}`
                }
            });

            const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageResponse.data.IpfsHash}`;
            setNftData({ ...nftData, image: imageUrl });
        } catch (error) {

            console.error("Error uploading file to IPFS:", error);
        }
    };

    const createNFT = async () => {
        if (!nftData.image || !nftData.name || !nftData.description || !nftData.price) return;
        console.log("Creating NFT...");
        try {
            const metadata = {
                name: nftData.name,
                description: nftData.description,
                image: nftData.image
            };
            const metadataFormData = new FormData();
            const timestamp = new Date().getTime();
            const fileName = `${generateRandomString(4) + '_metadata_' + timestamp + '.json'}`;
            metadataFormData.append('file', new Blob([JSON.stringify(metadata)], { type: 'application/json' }), fileName);
            const metadataResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", metadataFormData, {
                maxBodyLength: "Infinity",
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${metadataFormData._boundary}`,
                    'Authorization': `Bearer ${JWT}`
                }
            });
            const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`;
            // mint nft 
            // const res = await (await nft.mint(metadataUrl)).wait()
            const tx = await nft.mint(metadataUrl);
            const receipt = await tx.wait();
            const tokenId = receipt.events.filter(x => x.event === "NFTMinted")[0].args.tokenId;
            // get tokenId of new nft 
            // const id = await nft.tokenCount()
            // approve marketplace to spend nft
            // await (await nft.setApprovalForAll(marketplace.address, true)).wait()
            // Approve marketplace to spend specific NFT
            await (await nft.approveSpecific(marketplace.address, tokenId)).wait();
            // add nft to marketplace
            const listingPrice = ethers.utils.parseEther(nftData.price.toString())
            // await (await marketplace.makeItem(nft.address, id, listingPrice)).wait()
            await (await marketplace.makeItem(nft.address, tokenId, listingPrice)).wait()
            alert('NFT created and listed successfully!')
            // console.log("Metadata URL:", metadataUrl);
        } catch (error) {
            console.log(error)
            alert('Error creating NFT!')
            // console.log("Error uploading metadata to IPFS:", error);
        }
    }

    return (
        <div className="container-fluid mt-5">
            <div className="row">
                <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control
                                type="file"
                                required
                                name="file"
                                onChange={uploadToIPFS}
                            />
                            <Form.Control name='name' onChange={handleChange} size="lg" required type="text" placeholder="Name" />
                            <Form.Control name='description' onChange={handleChange} size="lg" required as="textarea" placeholder="Description" />
                            <Form.Control name='price' onChange={handleChange} size="lg" required type="number" placeholder="Price in ETH" />
                            {nftData.image && <img src={nftData.image} alt="Uploaded to IPFS" style={{ width: '150px' }} />}
                            <div className="d-grid px-0">
                                <Button
                                    onClick={createNFT}
                                    variant="primary"
                                    size="lg">
                                    Create & List NFT!
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Pinata;