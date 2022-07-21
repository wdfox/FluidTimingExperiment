/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SharedMap } from "fluid-framework";
// import { TinyliciousClient, TinyliciousAudience } from "@fluidframework/tinylicious-client";
import { AzureClient } from "@fluidframework/azure-client";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils"

export const diceValueKey = "dice-value-key";

// Load container and render the app

// const serviceConfig = {
//     connection: {
//         type: "local",
//         tokenProvider: new InsecureTokenProvider("" , { id: "userId" }),
//         endpoint: "http://localhost:7070",
//     }
// };

const serviceConfig = {
    connection: {
        tenantId: "1f213c3a-11e5-4493-ae9f-90124b0993d4", // REPLACE WITH YOUR TENANT ID
        tokenProvider: new InsecureTokenProvider("cd173f21a2a8e7b89b35213629ac5d13" /* REPLACE WITH YOUR PRIMARY KEY */, { id: "userId" }),
        endpoint: "https://us.fluidrelay.azure.com", // REPLACE WITH YOUR SERVICE ENDPOINT
        type: "remote",
    }
};

// const client = new TinyliciousClient();
const client = new AzureClient(serviceConfig);
const containerSchema = {
    initialObjects: { diceMap: SharedMap }
};
const root = document.getElementById("content");

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
 }

const createNewDice = async () => {
    const { container, services } = await client.createContainer(containerSchema);
    const audience = services.audience;
    console.log(audience);
    console.log(audience.getMyself());
    // var myself = audience.getMyself();
    // while (!myself) {
    //     console.log(audience)
    //     console.log(myself);
    //     await sleep(1000)
    //     myself = audience.getMyself()
    // }
    container.initialObjects.diceMap.set(diceValueKey, 1);
    const id = await container.attach();
    var myself = audience.getMyself();
    while (!myself) {
        console.log(audience)
        console.log(myself);
        await sleep(1000)
        myself = audience.getMyself()
    }
    console.log(myself)
    renderDiceRoller(container.initialObjects.diceMap, root);
    return id;
}

const loadExistingDice = async (id) => {
    const { container, services } = await client.getContainer(id, containerSchema);
    const audience = services.audience;
    console.log(audience);
    console.log(audience.getMyself());
    var myself = audience.getMyself();
    while (!myself) {
        console.log(audience)
        console.log(myself);
        await sleep(1000)
        myself = audience.getMyself()
    }
    console.log(myself)
    renderDiceRoller(container.initialObjects.diceMap, root);
}

async function start() {
    if (location.hash) {
        await loadExistingDice(location.hash.substring(1))
    } else {
        const id = await createNewDice();
        location.hash = id;
    }
}

start().catch((error) => console.error(error));


// Define the view

const template = document.createElement("template");

template.innerHTML = `
  <style>
    .wrapper { text-align: center }
    .dice { font-size: 200px }
    .roll { font-size: 50px;}
  </style>
  <div class="wrapper">
    <div class="dice"></div>
    <button class="roll"> Roll </button>
  </div>
`

const renderDiceRoller = (diceMap, elem) => {
    elem.appendChild(template.content.cloneNode(true));

    const rollButton = elem.querySelector(".roll");
    const dice = elem.querySelector(".dice");

    // Set the value at our dataKey with a random number between 1 and 6.
    rollButton.onclick = () => diceMap.set(diceValueKey, Math.floor(Math.random() * 6) + 1);

    // Get the current value of the shared data to update the view whenever it changes.
    const updateDice = () => {
        const diceValue = diceMap.get(diceValueKey);
        // Unicode 0x2680-0x2685 are the sides of a dice (⚀⚁⚂⚃⚄⚅)
        dice.textContent = String.fromCodePoint(0x267f + diceValue);
        dice.style.color = `hsl(${diceValue * 60}, 70%, 30%)`;
    };
    updateDice();

    // Use the changed event to trigger the rerender whenever the value changes.
    diceMap.on("valueChanged", updateDice);
}