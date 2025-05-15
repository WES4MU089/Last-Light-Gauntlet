// HUD Script for Updating the Titler (LSL)
// This script should be placed in your HUD. When you touch the HUD,
// it brings up a menu. Choosing “Wounds” shows a submenu with “Inflict”, “Heal” and “Reset”.
// Selecting one sends the appropriate command message to the titler script.

integer GLOBAL_CHANNEL = -12345;  // The channel the titler listens on.
integer DIALOG_CHANNEL = 12345;     // A separate channel for dialog responses.

list MAIN_MENU_OPTIONS = ["Wounds"];
list WOUNDS_MENU_OPTIONS = ["Inflict", "Heal", "Reset"];

// Global variable to store the active character name as defined in combatData.
string activeCharName = "Character";

default {
    state_entry() {
        // Start listening for dialog selections.
        llListen(DIALOG_CHANNEL, "", llGetOwner(), "");
        // Also listen on the GLOBAL_CHANNEL for incoming update messages.
        llListen(GLOBAL_CHANNEL, "", NULL_KEY, "");
    }
    
    attach(key avatar) {
        if(avatar != NULL_KEY) {
            llResetScript();
        }
    }
    
    touch_start(integer total_number) {
        // When the HUD is touched, show the main menu dialog to the owner.
        key toucher = llDetectedKey(0);
        llDialog(toucher, "Select an option:", MAIN_MENU_OPTIONS, DIALOG_CHANNEL);
    }
    
    listen(integer channel, string name, key id, string message) {
        // Process dialog selections on DIALOG_CHANNEL.
        if (channel == DIALOG_CHANNEL) {
            if (message == "Wounds") {
                // Show the wounds submenu.
                llDialog(id, "Wounds Options:", WOUNDS_MENU_OPTIONS, DIALOG_CHANNEL);
            }
            else if (message == "Inflict") {
                // "Inflict" applies a wound.
                string ownerUUID = (string)llGetOwner();
                // Use activeCharName from combatData.
                string commandMessage = ownerUUID + "|APPLY|" + activeCharName;
                llSay(GLOBAL_CHANNEL, commandMessage);
            }
            else if (message == "Heal") {
                // "Heal" removes a wound.
                string ownerUUID = (string)llGetOwner();
                string commandMessage = ownerUUID + "|REMOVE|" + activeCharName;
                llSay(GLOBAL_CHANNEL, commandMessage);
            }
            else if (message == "Reset") {
                // "Reset" resets health to full.
                string ownerUUID = (string)llGetOwner();
                string commandMessage = ownerUUID + "|RESET|" + activeCharName;
                llSay(GLOBAL_CHANNEL, commandMessage);
            }
        }
        // Process incoming messages on GLOBAL_CHANNEL.
        else if (channel == GLOBAL_CHANNEL) {
            list tokens = llParseString2List(message, ["|"], []);
            if (llGetListLength(tokens) < 3) {
                return;
            }
            // Extract tokens.
            string targetUUID = llList2String(tokens, 0);
            string command = llToUpper(llStringTrim(llList2String(tokens, 1), STRING_TRIM));
            string msgCharName = llStringTrim(llList2String(tokens, 2), STRING_TRIM);
            // Update activeCharName only if the message is intended for this owner and the command is "NAME".
            if (targetUUID == (string)llGetOwner() && command == "NAME") {
                activeCharName = msgCharName;
            }
        }
    }
}
