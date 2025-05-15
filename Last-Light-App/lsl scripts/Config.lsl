/**************************************************************************
 * blackfyre_menu_slot_register_admin.lsl
 * 
 * A single script with a main menu offering:
 *  - User Panel       (POST to API_URL -> token -> llLoadURL)
 *  - Choose Slot      (slot selection -> POST -> re-sync -> parse stats)
 *  - Show Stats       (Sync active character and display full sheet in local chat)
 *  - Admin Panel      (POST to ADMIN_API_URL -> token -> llLoadURL)
 *  - Cancel
 * 
 * No auto-sync on attach.
 **************************************************************************/

// -------------------- CONFIGURATION --------------------

string API_URL         = "https://sosr.ngrok.app/sl-auth";
string TOKEN_LOGIN_URL = "https://sosr.ngrok.app/token-login?token=";

string CHOOSE_SLOT_URL = "https://sosr.ngrok.app/slsync/choose-slot";
string SYNC_URL        = "https://sosr.ngrok.app/slsync/active?SL_UUID=";

string ADMIN_API_URL   = "https://sosr.ngrok.app/sl-admin-auth";
string TOKEN_ADMIN_URL = "https://sosr.ngrok.app/admin-token-login?token=";

integer SKILL_LINK_NUM  = 3;
integer COMBAT_LINK_NUM = 5;
integer DIALOG_CHANNEL  = -987654;

// -------------------- GLOBALS --------------------
key    gUserKey = NULL_KEY;
string gUserName = "";
string gLastRequestType = ""; // "register", "chooseSlot", "sync", "sheet", or "adminLogin"

// Core attributes
integer g_strInt   = 0;
integer g_agiInt   = 0;
integer g_preInt   = 0;
integer g_wisInt   = 0;

// New globals for tracking Guard (a skill) and Defensive Rating
integer g_guardInt = 0;
integer g_defInt   = 0;

// New global for computed attack score.
integer g_attackScore = 0;

// Global for Health HUD messages: using same global channel as the health HUD.
integer GLOBAL_CHANNEL = -12345;

// ===========================================================================
// HELPER FUNCTIONS
// ===========================================================================

// Checks if a single character is "0".."9"
integer isDigit(string ch) {
    if(ch=="0" || ch=="1" || ch=="2" || ch=="3" ||
       ch=="4" || ch=="5" || ch=="6" || ch=="7" ||
       ch=="8" || ch=="9") {
        return TRUE;
    }
    return FALSE;
}

// Converts a single-digit character to integer
integer digitToInteger(string ch) {
    if(ch=="0") return 0;
    else if(ch=="1") return 1;
    else if(ch=="2") return 2;
    else if(ch=="3") return 3;
    else if(ch=="4") return 4;
    else if(ch=="5") return 5;
    else if(ch=="6") return 6;
    else if(ch=="7") return 7;
    else if(ch=="8") return 8;
    else if(ch=="9") return 9;
    return 0;
}

// Converts a numeric string to an integer
integer stringToInt(string s) {
    integer len = llStringLength(s);
    if(len <= 0) return 0;
    integer result = 0;
    integer negative = FALSE;
    integer i = 0;
    
    if(llGetSubString(s, 0, 0) == "-") {
        negative = TRUE;
        i = 1;
    }
    while(i < len) {
        string ch = llGetSubString(s, i, i);
        if(isDigit(ch)) {
            result = result * 10 + digitToInteger(ch);
            i++;
        } else {
            i = len; // forcibly end
        }
    }
    if(negative) result = -result;
    return result;
}

// buildSkillLines: Combine list items into lines of up to 4 items separated by " | "
string buildSkillLines(list skills) {
    integer count = llGetListLength(skills);
    string result = "";
    integer i;
    for(i = 0; i < count; i++) {
        result += llList2String(skills, i);
        if((i % 4) == 3) {
            result += "\n";
        } else if(i < count - 1) {
            result += " | ";
        }
    }
    if(count > 0 && (count % 4) != 0) {
        result += "\n";
    }
    return result;
}

// ========== User Panel Flow ==========
doRegister() {
    string jsonData = llJsonSetValue("{}", ["SL_UUID"], (string)gUserKey);
    jsonData = llJsonSetValue(jsonData, ["SL_Name"], gUserName);
    
    gLastRequestType = "register";
    llHTTPRequest(
        API_URL,
        [HTTP_METHOD, "POST", HTTP_MIMETYPE, "application/json"],
        jsonData
    );
}

// ========== Admin Panel Flow ==========
doAdminLogin() {
    string jsonData = llJsonSetValue("{}", ["SL_UUID"], (string)gUserKey);
    jsonData = llJsonSetValue(jsonData, ["SL_Name"], gUserName);
    gLastRequestType = "adminLogin";
    llHTTPRequest(
        ADMIN_API_URL,
        [HTTP_METHOD, "POST", HTTP_MIMETYPE, "application/json"],
        jsonData
    );
}

// ========== Slot Selection & Sync Flow ==========
setActiveSlot(integer slotNum) {
    string jsonBody = llJsonSetValue("{}", ["SL_UUID"], (string)gUserKey);
    jsonBody = llJsonSetValue(jsonBody, ["slot"], (string)slotNum);
    
    gLastRequestType = "chooseSlot";
    llHTTPRequest(
        CHOOSE_SLOT_URL,
        [HTTP_METHOD, "POST", HTTP_MIMETYPE, "application/json"],
        jsonBody
    );
}

// syncCharacter: GET from SYNC_URL
syncCharacter() {
    // For a stats request, we want the full character sheet read out.
    if(gLastRequestType != "sheet") {
        gLastRequestType = "sync";
    }
    string url = SYNC_URL + (string)gUserKey;
    llHTTPRequest(url, [HTTP_METHOD, "GET"], "");
}

// parseAndSendStats: Parse the pipeline and distribute data.
// Only the displayStats() output (the character sheet) will be visible to the user.
parseAndSendStats(string pipeline) {
    list parts = llParseString2List(pipeline, ["|"], []);
    integer len = llGetListLength(parts);
    if(len < 3) {
        // Minimal error handling (could be enhanced)
        return;
    }
    // The first three fields are expected to be plain text (charName, charAge, charHouse)
    string charName  = llList2String(parts, 0);
    string charAge   = llList2String(parts, 1);
    string charHouse = llList2String(parts, 2);
    
    list nonCombatSkillPairs = [];
    list combatSkillPairs = [];
    
    // Reset core attributes and new globals
    g_strInt   = 0;
    g_agiInt   = 0;
    g_preInt   = 0;
    g_wisInt   = 0;
    g_guardInt = 0;
    g_defInt   = 0;
    
    integer i;
    for(i = 3; i < len; i++) {
        string chunk = llList2String(parts, i);
        if(chunk != "") {
            list kv = llParseString2List(chunk, ["="], []);
            if(llGetListLength(kv) == 2) {
                string keyName = llList2String(kv, 0);
                string valStr  = llList2String(kv, 1);
                string lower   = llToLower(keyName);
                integer valInt = stringToInt(valStr);
                
                // Core Attributes: store but do not add to skills lists.
                if(lower == "strength") {
                    g_strInt = valInt;
                }
                else if(lower == "agility") {
                    g_agiInt = valInt;
                }
                else if(lower == "presence") {
                    g_preInt = valInt;
                }
                else if(lower == "wisdom") {
                    g_wisInt = valInt;
                }
                // Other values (skills)
                else if(lower == "guard") {
                    g_guardInt = valInt;
                    nonCombatSkillPairs += [ keyName + "=" + (string)valInt ];
                }
                else if(lower == "defensiverating") {
                    g_defInt = valInt;
                }
                else if(lower == "melee" || lower == "ranged") {
                    combatSkillPairs += [ keyName + "=" + (string)valInt ];
                }
                else {
                    nonCombatSkillPairs += [ keyName + "=" + (string)valInt ];
                }
            }
        }
    }
    
    // If Defensive Rating wasn't provided by the server, calculate it:
    if(g_defInt == 0) {
        // Updated calculation: STR + AGI + GUARD + 8
        g_defInt = g_strInt + g_agiInt + g_guardInt + 8;
    }
    
    // Compute attack score based on Melee.
    integer meleeSkill = 0;
    integer lenCombat = llGetListLength(combatSkillPairs);
    integer j;
    for(j = 0; j < lenCombat; j++) {
        string pair = llList2String(combatSkillPairs, j);
        if(llSubStringIndex(pair, "Melee=") == 0 && meleeSkill == 0) {
            meleeSkill = stringToInt(llGetSubString(pair, 6, -1));
        }
    }
    integer baseDice = (integer)llRound((float)g_strInt / 2.0);
    g_attackScore = baseDice + meleeSkill;
    
    // Build combat data for link #6 including key=value pairs.
    list combatDataList = [
        "SLUUID=" + (string)gUserKey,
        "NAME=" + charName,
        "HOUSE=" + charHouse,
        "ATTACK=" + (string)g_attackScore,
        "STR=" + (string)g_strInt,
        "AGI=" + (string)g_agiInt,
        "GUARD=" + (string)g_guardInt,
        "DR="  + (string)g_defInt
    ] + combatSkillPairs;
    string combatString = llDumpList2String(combatDataList, "|");
    llMessageLinked(COMBAT_LINK_NUM, 300, combatString, NULL_KEY);
    
    // Build skill data for link #4 (to parent HUD)
    list skillDataList = [
        charName, charHouse,
        "STR=" + (string)g_strInt,
        "AGI=" + (string)g_agiInt,
        "PRE=" + (string)g_preInt,
        "WIS=" + (string)g_wisInt
    ] + nonCombatSkillPairs;
    string skillString = llDumpList2String(skillDataList, "|");
    llMessageLinked(SKILL_LINK_NUM, 200, skillString, NULL_KEY);
    
    // Combine skills into separate sheets, 4 per line
    string combatSkillsSheet = buildSkillLines(combatSkillPairs);
    string nonCombatSkillsSheet = buildSkillLines(nonCombatSkillPairs);
    
    // Show summary (sheet) in local chat, organized by section.
    // This is the only detailed output the user sees.
    displayStats(charName, charAge, charHouse, 
                 g_strInt, g_agiInt, g_preInt, g_wisInt, g_defInt,
                 combatSkillsSheet, nonCombatSkillsSheet);
    
    // Send the character name to the Health HUD
    llSay(GLOBAL_CHANNEL, (string)gUserKey + "|NAME|" + charName);
}

// displayStats: Show character stats organized into sections (kept intact)
displayStats(string charName, string charAge, string charHouse,
             integer iStr, integer iAgi, integer iPre, integer iWis, integer iDef,
             string combatSkillsSheet, string nonCombatSkillsSheet) {
    string message = "=== Character Sheet ===\n" +
                     "Character Info:\n" +
                     "   Name: "  + charName  + "\n" +
                     "   Age: "   + charAge   + "\n" +
                     "   House: " + charHouse + "\n\n" +
                     
                     "Core Attributes:\n" +
                     "   Strength: " + (string)iStr + "\n" +
                     "   Agility: "  + (string)iAgi + "\n" +
                     "   Presence: " + (string)iPre + "\n" +
                     "   Wisdom: "   + (string)iWis + "\n\n" +
                     
                     "Secondary Attributes:\n" +
                     "   Defense Rating: " + (string)iDef + "\n\n" +
                     
                     "Combat Skills:\n" + combatSkillsSheet + "\n" +
                     
                     "Non-Combat Skills:\n" + nonCombatSkillsSheet +
                     
                     "=======================\n";
    llOwnerSay(message);
}

// ===========================================================================
// DEFAULT STATE
// ===========================================================================

default {
    state_entry() {
        // (Any initialization code can go here)
    }
    
    attach(key avatar) {
        if (avatar != NULL_KEY) {
            gUserKey = avatar;
            gUserName = llKey2Name(avatar);
            // Reset the script when an avatar attaches to ensure a clean state.
            llResetScript();
        }
        else {
            gUserKey = NULL_KEY;
            gUserName = "";
        }
    }
    
    touch_start(integer num_detected) {
        gUserKey = llDetectedKey(0);
        gUserName = llKey2Name(gUserKey);
        
        llListenRemove(0);
        llListen(DIALOG_CHANNEL, "", gUserKey, "");
        
        llDialog(
            gUserKey,
            "Blackfyre Main Menu:",
            ["User Panel", "Choose Slot", "Show Stats", "Admin Panel", "Cancel"],
            DIALOG_CHANNEL
        );
    }
    
    listen(integer channel, string name, key id, string message) {
        if(channel == DIALOG_CHANNEL && id == gUserKey) {
            if(message == "User Panel") {
                doRegister();
            }
            else if(message == "Choose Slot") {
                llDialog(
                    gUserKey,
                    "Pick a character slot:",
                    ["Slot 1", "Slot 2", "Cancel"],
                    DIALOG_CHANNEL
                );
            }
            else if(message == "Slot 1") {
                setActiveSlot(1);
            }
            else if(message == "Slot 2") {
                setActiveSlot(2);
            }
            else if(message == "Show Stats") {
                // Only this action results in a full character sheet read out.
                gLastRequestType = "sheet";
                syncCharacter();
            }
            else if(message == "Admin Panel") {
                doAdminLogin();
            }
            else {
                // For Cancel or unrecognized input, do nothing.
            }
        }
    }
    
    http_response(key request_id, integer status, list metadata, string body) {
        if(gLastRequestType == "register") {
            if(status == 200) {
                string token = llJsonGetValue(body, ["token"]);
                if(token != "") {
                    string loginURL = TOKEN_LOGIN_URL + token;
                    llLoadURL(gUserKey, "Complete your registration.", loginURL);
                }
            }
        }
        else if(gLastRequestType == "chooseSlot") {
            if(status == 200) {
                // Instead of a detailed message, simply sync without extra output.
                syncCharacter();
            }
        }
        else if(gLastRequestType == "sync" || gLastRequestType == "sheet") {
            if(status == 200) {
                parseAndSendStats(body);
            }
        }
        else if(gLastRequestType == "adminLogin") {
            if(status == 200) {
                string token = llJsonGetValue(body, ["token"]);
                if(token != "") {
                    string adminPortalURL = TOKEN_ADMIN_URL + token;
                    llLoadURL(gUserKey, "Complete your admin login.", adminPortalURL);
                }
            } 
        }
    }
}
