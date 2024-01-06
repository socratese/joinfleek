const axios = require('axios');

let lastId = null;
const discordWebhookUrl = 'https://discord.com/api/webhooks/942549263550922763/VVsR7fSE3ihVguEfitYLQheTQdVFnDVMWJ5HwOs5F7-VfpuHBvFotjarkJ08Vz9ti6cc';

async function sendToDiscord(product) {
    const sizes = product.variants.map(variant => variant.title).join(', ');
    const restockTime = new Date().toLocaleString();
    const addToCartLink = `https://joinfleek.com/cart/${product.variants[0].id}:1`;

    let message = {
        content: null,
        embeds: [{
            title: product.title,
            description: product.description || 'No description available', // Adding description
            color: 32372, // Specified color
            fields: [
                { name: 'Price', value: `$${product.variants[0].price}`, inline: true },
                { name: 'Nb Pieces', value: sizes, inline: true }, // Assuming Nb Pieces refers to sizes
                { name: 'ATC', value: `[Add to Cart](${addToCartLink})`, inline: true }
            ],
            footer: {
                text: 'by PING\'TED',
                icon_url: 'https://media.discordapp.net/attachments/1120842107536547896/1122795178042867782/logo_pingted_png.png?width=605&height=605'
            }
        }],
        attachments: []
    };

    try {
        await axios.post(discordWebhookUrl, message);
        console.log('Message sent to Discord');
    } catch (error) {
        console.error('Failed to send message to Discord:', error);
    }
}

async function checkProduct() {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://joinfleek.com/products.json',
        headers: { 
            'Cookie': '_shopify_s=efe19fc2-6c5a-41c9-9a8e-11b768f0025f; _shopify_y=dceada5b-3a51-4c8b-9a75-bb522884cf2c; cart_currency=USD'
        }
    };

    try {
        let response = await axios.request(config);

        if (response.status === 430) {
            console.log('Received 430 response. Pausing for 5 minutes.');
            setTimeout(checkProduct, 300000);
            return;
        }

        let product = response.data.products[0];
        if (lastId !== product.id) {
            console.log('New product detected:', product.title);
            lastId = product.id;
            await sendToDiscord(product);
        } else {
            console.log('No new product detected');
        }
    } catch (error) {
        console.error('Error fetching product data:', error);
    }

    setTimeout(checkProduct, 60000);
}

checkProduct();
