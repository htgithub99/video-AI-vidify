export const TEXT_SRC_SERVER_SERVICES_SUNOAUTOMATIONSERVICE_TS = "src/server/services/sunoAutomationService.ts" as const;
export const TEXT_UTF8 = "utf8" as const;
export const TEXT_SRC_CONSTANTS_SUNOAUTOMATION_TS = "src/constants/sunoAutomation.ts" as const;
export const TEXT_HTTPS_STUDIO_API_PROD_SUNO_COM_API_PLAYLIST_CREATE = "https://studio-api-prod.suno.com/api/playlist/create/" as const;
export const TEXT_HTTPS_STUDIO_API_PROD_SUNO_COM_API_PLAYLIST_UPDATE_CLIPS = "https://studio-api-prod.suno.com/api/playlist/update_clips/" as const;
export const ACCOUNT_WORKSPACE_HTML = "<nav>Home Explore Create Studio Library musicaivietnam</nav><button>Simple</button><button>Advanced</button><main>Sounds v6-mini Audio Voice Image</main>" as const;
export const INCORRECT_WORKSPACE_HTML = "<nav>Home Explore Create Studio Library another-workspace</nav><button>Simple</button><button>Advanced</button>" as const;
export const SEPARATE_STYLES_HTML = `
    <textarea placeholder="Exclude styles">wrong existing exclusion</textarea>
    <section><div><h3>Styles</h3><div><textarea placeholder="Add a style">wrong existing music style</textarea></div></div></section>
  ` as const;
export const TEXT_MAIN_SUNO_STYLES_INPUT_WAS_NOT_FOUND = "Main Suno Styles input was not found" as const;
export const TEXT_AUTHENTIC_VIETNAMESE_BOLERO_76_BPM = "authentic vietnamese bolero, 76 bpm" as const;
export const TEXT_TEXTAREA_PLACEHOLDER_ADD_A_STYLE = 'textarea[placeholder="Add a style"]' as const;
export const TEXT_TEXTAREA_PLACEHOLDER_EXCLUDE_STYLES = 'textarea[placeholder="Exclude styles"]' as const;
export const TEXT_WRONG_EXISTING_EXCLUSION = "wrong existing exclusion" as const;
export const ADVANCED_FORM_HTML = `
    <div hidden>
      <div data-testid="create-form-styles-wrapper"><textarea>hidden style</textarea></div>
      <div contenteditable="true" aria-label="Lyrics editor" role="textbox">hidden lyrics</div>
      <div><span>Duration</span><button>Auto</button></div>
      <div role="slider" aria-label="Variety" aria-valuenow="1" aria-valuemin="0" aria-valuemax="4"></div>
      <div><span>Max Mode</span><button>Off</button></div>
      <div><span>Personalize</span><button>Off</button></div>
    </div>
    <div role="tablist" aria-label="What to create"><button role="tab" aria-selected="true">Songs</button></div>
    <button role="tab" aria-selected="false" onclick="this.setAttribute('aria-selected', 'true'); setTimeout(() => document.querySelector('#advanced-form').hidden = false, 100)">Advanced</button>
    <div id="advanced-form" hidden>
      <div role="button" aria-expanded="false" onclick="this.setAttribute('aria-expanded', 'true'); document.querySelector('#lyrics').hidden = false">Lyrics</div>
      <div id="lyrics" hidden contenteditable="true" role="textbox" aria-label="Lyrics editor"><p><br></p></div>
      <textarea aria-label="Cowriter prompt">keep cowriter</textarea>
      <div role="button" aria-expanded="false" onclick="this.setAttribute('aria-expanded', 'true'); document.querySelector('#styles-wrapper').hidden = false">Styles</div>
      <div id="styles-wrapper" data-testid="create-form-styles-wrapper" hidden><textarea placeholder="powerful piano, bass 808, bouncy 808s, trip hop, melancholy"></textarea></div>
      <button aria-expanded="false" onclick="this.setAttribute('aria-expanded', 'true'); document.querySelector('#more-options').hidden = false">More Options</button>
      <div id="more-options" hidden>
        <input placeholder="Exclude styles">
        <div>Vocal Gender<button data-selected="false">Male</button><button data-selected="false">Female</button></div>
        <div><span>Duration</span><button data-selected="true">Custom</button><button data-selected="false">Auto</button></div>
        <div><span>Max Mode</span><button data-selected="false">Off</button><button data-selected="true">On</button></div>
        <div role="slider" tabindex="0" aria-label="Weirdness" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
        <div role="slider" tabindex="0" aria-label="Style Influence" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
        <div role="slider" tabindex="0" aria-label="Variety" aria-valuenow="1" aria-valuemin="0" aria-valuemax="4"></div>
        <div><span>Personalize</span><button data-selected="false">Off</button><button data-selected="true">On</button></div>
      </div>
      <input placeholder="Song Title (Optional)">
    </div>
    <script>
      document.querySelectorAll('[role="slider"]').forEach(slider => slider.style.cssText = 'width: 200px; height: 20px');
      document.querySelectorAll('#more-options button').forEach(button => button.onclick = () => {
        button.parentElement.querySelectorAll('button').forEach(other => other.setAttribute('data-selected', String(other === button)));
      });
      document.querySelectorAll('#more-options [role="slider"]').forEach(slider => slider.onkeydown = event => {
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        slider.setAttribute('aria-valuenow', String(Number(slider.getAttribute('aria-valuenow')) + delta));
      });
    </script>
  ` as const;
export const TEXT_EDM_DISTORTED_GUITARS = "EDM, distorted guitars" as const;
export const TEXT_MALE = "male" as const;
export const TEXT_AUTO = "auto" as const;
export const TEXT_VISIBLE_TRUE = "visible=true" as const;
export const TEXT_VERSE_LOI_HAT_TIENG_VIET_CHORUS_MOT_CAU_HAT_MOI = "[Verse]\nLời hát tiếng Việt\n[Chorus]\nMột câu hát mới" as const;
export const TEXT_VERSE = "[Verse]" as const;
export const TEXT_LOI_HAT_TIENG_VIET = "Lời hát tiếng Việt" as const;
export const TEXT_CHORUS = "[Chorus]" as const;
export const TEXT_MOT_CAU_HAT_MOI = "Một câu hát mới" as const;
export const TEXT_STYLES_WRAPPER_TEXTAREA = "#styles-wrapper textarea" as const;
export const TEXT_DIV_HIDDEN_TEXTAREA = "div[hidden] textarea" as const;
export const TEXT_HIDDEN_STYLE = "hidden style" as const;
export const TEXT_COWRITER_PROMPT = "Cowriter prompt" as const;
export const TEXT_KEEP_COWRITER = "keep cowriter" as const;
export const TEXT_EXCLUDE_STYLES = "Exclude styles" as const;
export const TEXT_MORE_OPTIONS_ARIA_LABEL_WEIRDNESS = '#more-options [aria-label="Weirdness"]' as const;
export const TEXT_ARIA_VALUENOW = "aria-valuenow" as const;
export const TEXT_30 = "30" as const;
export const TEXT_MORE_OPTIONS_ARIA_LABEL_STYLE_INFLUENCE = '#more-options [aria-label="Style Influence"]' as const;
export const TEXT_80 = "80" as const;
export const TEXT_MORE_OPTIONS_ARIA_LABEL_VARIETY = '#more-options [aria-label="Variety"]' as const;
export const TEXT_3 = "3" as const;
export const TEXT_MORE_OPTIONS_BUTTON_DATA_SELECTED_TRUE = '#more-options button[data-selected="true"]' as const;
export const COMMA_SEPARATOR = "," as const;
export const TEXT_MALE_AUTO_OFF_OFF = "Male,Auto,Off,Off" as const;
export const TEXT_BOLERO_HAI_NGOAI = "BOLERO_HAI_NGOAI" as const;
export const appliedInspoHtml = (inspoName: string): string => `
    <input placeholder="Search clips">
    <button id="inspo-button" aria-label="Add inspiration from a playlist" type="button" onclick="document.querySelector('#inspo-dialog').hidden = false">+ Inspo</button>
    <div id="inspo-dialog" role="dialog" hidden>
      <input placeholder="Search" oninput="setTimeout(() => {
        const row = document.querySelector('#inspo-result');
        row.hidden = false;
      }, 1500)">
      <div id="inspo-result" class="cursor-pointer" hidden onclick="
        document.querySelector('#inspo-button').remove();
        document.querySelector('#selected-inspo').hidden = false;
        document.querySelector('#inspo-dialog').hidden = true;
      "><span>${inspoName}</span></div>
    </div>
    <div id="selected-inspo" hidden><button aria-label="Change condition type from Inspo">Inspo</button><button aria-label="Remove selected track">Remove</button></div>
  `;
export const TEXT_SELECTED_INSPO_BUTTON_ARIA_LABEL_REMOVE = '#selected-inspo button[aria-label^="Remove "]' as const;
export const TEXT_INPUT_PLACEHOLDER_SEARCH_CLIPS = 'input[placeholder="Search clips"]' as const;
export const EMPTY_TEXT = "" as const;
export const unappliedInspoHtml = (inspoName: string): string => `
    <button id="inspo-button" aria-label="Add inspiration from a playlist" type="button" onclick="document.querySelector('#inspo-dialog').hidden = false">Inspo</button>
    <div id="inspo-dialog" role="dialog" hidden>
      <input placeholder="Search">
      <div class="cursor-pointer" onclick="document.querySelector('#inspo-dialog').hidden = true"><span>${inspoName}</span></div>
    </div>
  `;
export const TEXT_INSPO_BUTTON = "#inspo-button" as const;
export const TEXT_INSPO = "Inspo" as const;
export const unselectableInspoHtml = (inspoName: string): string => `
    <button id="inspo-button" aria-label="Add inspiration from a playlist" type="button" onclick="document.querySelector('#inspo-dialog').hidden = false">Inspo</button>
    <div id="inspo-dialog" role="dialog" hidden>
      <input placeholder="Search">
      <button type="button">${inspoName}</button>
    </div>
  `;
export const EMPTY_INSPO_DIALOG_HTML = `
    <button id="inspo-button" aria-label="Add inspiration from a playlist" type="button" onclick="document.querySelector('#inspo-dialog').hidden = false">Inspo</button>
    <div id="inspo-dialog" role="dialog" hidden><input placeholder="Search"></div>
  ` as const;
export const CREATE_BUTTON_HTML = '<button type="button">Create</button>' as const;
export const TEXT_BUTTON = "button" as const;
export const TEXT_CREATE = "Create" as const;
export const TEXT_BOLERO_IS_APPLIED_ONLY_TO_SUNO_STYLES_NEVER_TO_EXCLUDE_STYLES = "BOLERO is applied only to Suno Styles, never to Exclude styles.\n" as const;
