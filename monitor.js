const axios = require('axios');

let lastId = null;
const discordWebhookUrl = 'https://discord.com/api/webhooks/1120091425569259550/DjmW8MAukEKRaSS8h7KvH1ZkW5dBt-iNGHPb76Rt2Y-zmrk63CAmRJrzxv61dvkU0Bl8';

async function sendToDiscord(product) {
    const sizes = product.variants.map(variant => variant.title).join(', ');
    const restockTime = new Date().toLocaleString();
    const addToCartLink = `https://joinfleek.com/cart/${product.variants[0].id}:1`; // Add to cart link

    // Check if body_html is not null before using replace
    const description = product.body_html ? product.body_html.replace(/<[^>]+>/g, '') : 'No description available';

    let message = {
        content: 'New product restocked!',
        embeds: [{
            title: product.title,
            url: `https://joinfleek.com/products/${product.handle}`,
            description: description,
            color: 0x008000, // Green color
            fields: [
                { name: 'Title', value: product.title },
                { name: 'Available Sizes', value: sizes, inline: true },
                { name: 'Price', value: `$${product.variants[0].price}`, inline: true },
                { name: 'Restocked At', value: restockTime, inline: false },
                { name: 'Add to Cart', value: `[Add to Cart](${addToCartLink})`, inline: false } // Add to cart field
            ],
            image: {
                url: product.images[0] ? product.images[0].src : 'https://via.placeholder.com/150' // Placeholder image if product image is not available
            },
            footer: {
                text: `Product ID: ${product.id}`
            }
        }]
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

        // Check for 430 response code
        if (response.status === 430) {
            console.log('Received 430 response. Pausing for 5 minutes.');
            setTimeout(checkProduct, 300000); // Wait for 5 minutes (300000 milliseconds)
            return; // Early return to prevent further execution
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

    // Set a delay before the next check (only if not handling a 430 response)
    setTimeout(checkProduct, 60000); // 60 seconds
}

// Start checking
checkProduct();


// Start checking
checkProduct();
