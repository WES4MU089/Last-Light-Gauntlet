// HUD Script for Updating the Titler (LSL)
// This script should be placed in your HUD.
// When you touch the HUD, it brings up a menu. Choosing “Wounds” shows a submenu with “Inflict”, “Heal” and “Reset”.
// Selecting one sends the appropriate command message to the titler script.

integer MAX_HEALTH = 3; // Maximum health.
integer currentHealth = MAX_HEALTH;
integer listenHandle;
integer GLOBAL_CHANNEL = -12345; // Set this to your HUD's channel.

string fullSymbol = "✦";
string emptySymbol = "✧";

// Function to update the floating text above the player's head.
// It displays a total of MAX_HEALTH symbols: fullSymbol for each current health point,
// and emptySymbol for each missing health point.
updateTitle() {
    string title = "";
    integer i;
    for (i = 0; i < MAX_HEALTH; i++) {
        if (i < currentHealth) {
            title += fullSymbol;
        } else {
            title += emptySymbol;
        }
    }
    llSetText(title, <1.0, 0.2, 0.2>, 1.0);
}

// Function to generate a narrative message based on the current health.
string getNarrativeMessage(string charName) {
    if (currentHealth == 2) {
        return charName + " is lightly injured.";
    }
    else if (currentHealth == 1) {
        return charName + " is severely injured.";
    }
    else if (currentHealth == 0) {
        return charName + " is gravely injured and has been incapacitated.";
    }
    else {
        // When fully healthy (3/3), no injury message is output.
        return "";
    }
}

default {
    state_entry() {
        // Initialize with full health display.
        updateTitle();
        // Start listening on the designated global channel.
        listenHandle = llListen(GLOBAL_CHANNEL, "", NULL_KEY, "");
        // Removed: llOwnerSay("HUD: Listening on channel " + (string)GLOBAL_CHANNEL);
    }
    
    attach(key avatar) {
        if (avatar != NULL_KEY) {
            llResetScript();
        }
    }
    
    listen(integer channel, string senderName, key id, string message) {
        // Removed debug output that previously displayed the received message and parsed tokens.
        list tokens = llParseString2List(message, ["|"], []);
        
        // Expect message format: "UUID|COMMAND|CHARACTER_NAME"
        if (llGetListLength(tokens) < 3) {
            return;
        }
        
        // Extract the target UUID, command, and character name.
        string targetUUID = llList2String(tokens, 0);
        string command = llToUpper(llStringTrim(llList2String(tokens, 1), STRING_TRIM));
        string charName = llStringTrim(llList2String(tokens, 2), STRING_TRIM);
        
        // Only process the command if the UUID matches the owner's UUID.
        if (targetUUID == (string)llGetOwner()) {
            if (command == "APPLY") {
                if (currentHealth > 0) {
                    currentHealth -= 1;
                    llSay(0, getNarrativeMessage(charName));
                } else {
                    llSay(0, "No further wounds can be applied; " + charName + " is already at the brink.");
                }
            }
            else if (command == "REMOVE") {
                if (currentHealth < MAX_HEALTH) {
                    currentHealth += 1;
                    if (currentHealth == MAX_HEALTH) {
                        llSay(0, charName + " has fully recovered.");
                    }
                    else {
                        llSay(0, getNarrativeMessage(charName));
                    }
                } else {
                    llSay(0, "No wounds to remove; " + charName + " is in perfect condition.");
                }
            }
            else if (command == "RESET") {
                currentHealth = MAX_HEALTH;
                llSay(0, charName + " has been fully healed.");
            }
            // Refresh the title display after processing the command.
            updateTitle();
        }
    }
}
