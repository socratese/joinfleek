const axios = require('axios');

let lastId = null;
const discordWebhookUrl = 'https://discord.com/api/webhooks/1222224132658430002/slILBugn19O34saKHD0rzbAM8TIGiSmRJFMBYhX0DEY57-G2YuwjNwRNu9evLcGcUNzl';

let retryCount = 0;
const maxRetries = 5;

async function sendToDiscord(product) {
    const sizes = product.variants.map(variant => variant.title).join(', ');
    const restockTime = new Date().toLocaleString();
    const addToCartLink = `https://joinfleek.myshopify.com/cart/${product.variants[0].id}:1`;

    let message = {
        content: null,
        embeds: [{
            title: product.title,
            description: product.description || 'No description available',
            color: 3447003,
            fields: [
                { name: 'Price', value: `$${product.variants[0].price}`, inline: true },
                { name: 'Nb Pieces', value: sizes, inline: true },
                { name: 'ATC', value: `[Add to Cart](${addToCartLink})`, inline: true }
            ],
            footer: {
                text: 'Resell Vault',
                icon_url: 'https://media.discordapp.net/attachments/1201619287765430362/1210584936700977192/Resell_Vault_Logo.png?ex=65eb1814&is=65d8a314&hm=7323219e720838b23420e2558af08cd98ef0aed39348276ca63bd733e3321796&=&format=webp&quality=lossless&width=540&height=540'
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
        url: 'https://joinfleek.myshopify.com/products.json',
        headers: { 
            'Cookie': '_shopify_s=efe19fc2-6c5a-41c9-9a8e-11b768f0025f; _shopify_y=dceada5b-3a51-4c8b-9a75-bb522884cf2c; cart_currency=USD'
        }
    };

    try {
        let response = await axios.request(config);

        if (response.status === 430) {
            console.log('Received 430 response. Pausing for 5 minutes.');
            setTimeout(checkProduct, 300000); // 5 minutes in milliseconds
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
        // Reset retry count after a successful request
        retryCount = 0;
    } catch (error) {
        console.error('Error fetching product data:', error);

        // Setting a constant delay of 5 minutes
        const delay = 5 * 60 * 1000; // 5 minutes in milliseconds
        console.log(`Retrying in ${delay / 1000 / 60} minutes...`);
        setTimeout(checkProduct, delay);
        return;
    }

    // Always schedule the next check
    setTimeout(checkProduct, 60000);
}

checkProduct();
