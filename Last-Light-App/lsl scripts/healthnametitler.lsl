// Simple Character Name Floating Text Script
// This script displays the character's name as white floating text above the player's head.
// It listens on the specified global channel for messages in the format: "UUID|COMMAND|CHARACTER_NAME"

integer listenHandle;
integer GLOBAL_CHANNEL = -12345; // Set this to your HUD's channel.
string characterName = "Player";  // Default name.

default
{
    state_entry()
    {
        // Initialize the floating text with the default character name in white.
        llSetText(characterName, <1.0, 1.0, 1.0>, 1.0);
        // Listen on the designated global channel.
        listenHandle = llListen(GLOBAL_CHANNEL, "", NULL_KEY, "");
    }
    
    attach(key avatar)
    {
        if (avatar != NULL_KEY)
        {
            llResetScript();
        }
    }
    
    listen(integer channel, string name, key id, string message)
    {
        // Expected message format: "UUID|COMMAND|CHARACTER_NAME"
        list tokens = llParseString2List(message, ["|"], []);
        if (llGetListLength(tokens) < 3)
        {
            return;
        }
        
        // Extract the target UUID, command, and character name.
        string targetUUID = llList2String(tokens, 0);
        string command = llToUpper(llStringTrim(llList2String(tokens, 1), STRING_TRIM));
        string newName = llStringTrim(llList2String(tokens, 2), STRING_TRIM);
        
        // Only update if the message is intended for the owner.
        if (targetUUID == (string)llGetOwner())
        {
            // Update the character name and floating text.
            characterName = newName;
            llSetText(characterName, <1.0, 1.0, 1.0>, 1.0);
        }
    }
}
