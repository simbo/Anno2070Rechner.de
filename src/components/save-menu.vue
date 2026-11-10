<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useI18n } from '../i18n';
import { keyName } from '../lib/keys';
import { dayOf, formatDay, gameName, gamesByUse, maxNameLength, type Game } from '../models/games';
import { pagePath } from '../routes';
import { useGamesStore } from '../stores/games';

/**
 * The disk icon in the header and its menu of saved games. The icon gets a green check once
 * the current game has inputs. The menu switches, renames and deletes games, starts new ones
 * and carries the current game to other browsers as text.
 */
const games = useGamesStore();
const route = useRoute();
const router = useRouter();
const { language, t } = useI18n();

type Panel = 'list' | 'export' | 'import';

const root = ref<HTMLElement>();
const isOpen = ref(false);
const panel = ref<Panel>('list');

// The order only changes when the menu opens, so that no entry moves under the mouse.
const list = ref<string[]>([]);
const editingId = ref<string>();
const editText = ref('');
const deletingId = ref<string>();

const exportText = ref('');
const exportCopied = ref(false);
const importText = ref('');
const importMessage = ref('');
const conflict = ref<{ game: Omit<Game, 'usedAt'>; existing: Game }>();

const name = (game: Pick<Game, 'name' | 'startedAt' | 'number'>): string => gameName(game, language.value);
const changedOn = (time: number): string => formatDay(dayOf(new Date(time)), language.value);

/**
 * The games in the order of the open menu. New and removed games take effect at once.
 *
 * @returns The games.
 */
function shownGames(): Game[] {
  const known = list.value
    .map(id => games.state.games.find(game => game.id === id))
    .filter((game): game is Game => game !== undefined);
  const added = gamesByUse(games.state.games).filter(game => !list.value.includes(game.id));
  return [...added, ...known];
}

/**
 * Resets everything inside the menu.
 */
function resetPanels(): void {
  panel.value = 'list';
  editingId.value = undefined;
  deletingId.value = undefined;
  importText.value = '';
  importMessage.value = '';
  conflict.value = undefined;
}

/**
 * Closes the menu.
 */
function close(): void {
  isOpen.value = false;
  resetPanels();
}

/**
 * Opens or closes the menu.
 */
function toggle(): void {
  if (isOpen.value) {
    close();
    return;
  }
  list.value = gamesByUse(games.state.games).map(game => game.id);
  isOpen.value = true;
}

/**
 * Leads to the calculator, where games are used, unless the visitor is already there.
 */
function showCalculator(): void {
  if (route.meta.page !== 'population') void router.push(pagePath('population', language.value));
}

/**
 * Opens a game.
 *
 * @param game - The game.
 */
function open(game: Game): void {
  if (game.id !== games.current.id) games.open(game.id);
  close();
  showCalculator();
}

/**
 * Starts an empty game.
 */
function startNew(): void {
  games.startNew();
  close();
  showCalculator();
}

/**
 * Starts renaming a game inline.
 *
 * @param game - The game.
 */
function startEditing(game: Game): void {
  deletingId.value = undefined;
  editingId.value = game.id;
  editText.value = name(game);
  void nextTick(() => {
    const input = root.value?.querySelector<HTMLInputElement>('.save-menu-rename');
    input?.focus();
    input?.select();
  });
}

/**
 * Applies the new name. An unchanged automatic name stays automatic.
 */
function finishEditing(): void {
  const game = games.state.games.find(entry => entry.id === editingId.value);
  if (game && editText.value !== name(game)) games.rename(game.id, editText.value);
  editingId.value = undefined;
}

/**
 * Deletes the game that was confirmed.
 */
function confirmDelete(): void {
  if (deletingId.value !== undefined) games.remove(deletingId.value);
  deletingId.value = undefined;
}

/**
 * Selects the text field's content for copying.
 */
function selectExportField(): void {
  const field = root.value?.querySelector<HTMLTextAreaElement>('.save-menu-text');
  field?.focus();
  field?.select();
}

/**
 * Shows the text of the current game and copies it, as far as the browser allows that.
 */
async function showExport(): Promise<void> {
  resetPanels();
  panel.value = 'export';
  exportText.value = games.exportCurrent();
  exportCopied.value = false;
  await nextTick();
  selectExportField();
  try {
    // Old browsers have no asynchronous clipboard; the text then stays selected for copying.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Missing in old browsers.
    await globalThis.navigator.clipboard?.writeText(exportText.value);

    exportCopied.value = Boolean(globalThis.navigator.clipboard);
  } catch {
    exportCopied.value = false;
  }
}

/**
 * Shows the field for importing a game.
 */
function showImport(): void {
  resetPanels();
  panel.value = 'import';
  void nextTick(() => root.value?.querySelector<HTMLTextAreaElement>('.save-menu-text')?.focus());
}

/**
 * Finishes an import that opened a game.
 */
function finishImport(): void {
  close();
  showCalculator();
}

/**
 * Imports the entered text.
 */
function runImport(): void {
  const outcome = games.importText(importText.value);
  importMessage.value = '';
  switch (outcome.kind) {
    case 'invalid': {
      importMessage.value = t('Dieser Text ist kein gültiges Spiel.');
      break;
    }
    case 'newer': {
      importMessage.value = t('Dieser Text stammt aus einer neueren Version der Seite.');
      break;
    }
    case 'same': {
      importMessage.value = t('Dieses Spiel ist schon vorhanden.');
      showCalculator();
      break;
    }
    case 'conflict': {
      conflict.value = { game: outcome.game, existing: outcome.existing };
      break;
    }
    default: {
      finishImport();
    }
  }
}

/**
 * Resolves a different version of an existing game.
 *
 * @param action - Whether it replaces the game or becomes a copy.
 */
function resolveConflict(action: 'overwrite' | 'copy'): void {
  if (!conflict.value) return;
  if (action === 'overwrite') games.overwrite(conflict.value.game);
  else games.addCopy(conflict.value.game);
  finishImport();
}

/**
 * Handles the Escape key inside the menu: it leaves the innermost step first.
 *
 * @param event - The keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  if (keyName(event) !== 'Escape') return;
  if (editingId.value !== undefined) editingId.value = undefined;
  else if (deletingId.value !== undefined) deletingId.value = undefined;
  else if (panel.value === 'list') close();
  else resetPanels();
}

// A clicked button can already be gone when its click reaches the window, because the menu
// updates in between, so the menu notes clicks on their way up instead of looking them up.
let clickedInside = false;

/**
 * Closes the menu when the visitor clicks elsewhere.
 */
function onWindowClick(): void {
  if (!clickedInside && isOpen.value) close();
  clickedInside = false;
}
onMounted(() => {
  globalThis.addEventListener('click', onWindowClick);
});
onBeforeUnmount(() => {
  globalThis.removeEventListener('click', onWindowClick);
});
</script>

<template>
  <div id="save-chooser" ref="root" @click="clickedInside = true" @keydown="onKeyDown">
    <ul class="user-menu">
      <li class="save" :class="{ saved: games.hasInputs && games.storageWorks }">
        <a
          href="#"
          :title="t('Gespeicherte Spiele')"
          :aria-label="t('Gespeicherte Spiele')"
          aria-haspopup="true"
          :aria-expanded="isOpen"
          @click.prevent="toggle"
        ></a>
      </li>
    </ul>
    <div v-if="isOpen" id="save-menu" class="ui-selectmenu-menu ui-selectmenu-open">
      <div class="save-menu-body">
        <template v-if="panel === 'list'">
          <p>
            {{
              games.storageWorks
                ? t('Automatisch im Browser gespeichert.')
                : t('Dieser Browser erlaubt kein Speichern. Deine Eingaben gehen beim Schließen verloren.')
            }}
          </p>
          <ul>
            <li
              v-for="game in shownGames()"
              :key="game.id"
              :class="{ 'ui-selectmenu-item-selected': game.id === games.current.id }"
            >
              <input
                v-if="editingId === game.id"
                v-model="editText"
                class="save-menu-rename"
                type="text"
                :maxlength="maxNameLength"
                @keydown.enter.prevent="finishEditing"
                @blur="finishEditing"
              />
              <div v-else-if="deletingId === game.id" class="save-menu-confirm">
                <span>{{ t('Wirklich löschen?') }}</span>
                <input type="button" :value="t('Ja')" @click="confirmDelete" />
                <input type="button" :value="t('Nein')" @click="deletingId = undefined" />
              </div>
              <template v-else>
                <a href="#" :title="name(game)" @click.prevent="open(game)">{{ name(game) }}</a>
                <button
                  type="button"
                  class="save-icon rename"
                  :title="t('Umbenennen')"
                  :aria-label="t('Umbenennen')"
                  @click="startEditing(game)"
                ></button>
                <button
                  type="button"
                  class="save-icon delete"
                  :title="t('Löschen')"
                  :aria-label="t('Löschen')"
                  @click="
                    editingId = undefined;
                    deletingId = game.id;
                  "
                ></button>
              </template>
            </li>
          </ul>
          <div class="save-menu-footer">
            <a href="#" class="save-menu-new" @click.prevent="startNew"
              ><span class="save-icon add"></span>{{ t('Neues Spiel') }}</a
            >
            <button
              type="button"
              class="save-icon export"
              :title="t('Spiel exportieren')"
              :aria-label="t('Spiel exportieren')"
              @click="showExport"
            ></button>
            <button
              type="button"
              class="save-icon import"
              :title="t('Spiel importieren')"
              :aria-label="t('Spiel importieren')"
              @click="showImport"
            ></button>
          </div>
        </template>
        <template v-else-if="panel === 'export'">
          <p>
            {{
              exportCopied
                ? t(
                    'Dieser Text enthält das aktuelle Spiel. Er ist kopiert und lässt sich in einem anderen Browser importieren.',
                  )
                : t('Dieser Text enthält das aktuelle Spiel. Kopiere ihn und importiere ihn in einem anderen Browser.')
            }}
          </p>
          <textarea class="save-menu-text" readonly rows="4" :value="exportText" @focus="selectExportField"></textarea>
          <div class="save-menu-buttons">
            <input type="button" :value="t('Schließen')" @click="resetPanels" />
          </div>
        </template>
        <template v-else-if="conflict">
          <p>
            <strong>„{{ name(conflict.existing) }}“</strong> {{ t('gibt es hier schon.') }}<br />
            {{ t('Hier geändert am') }} {{ changedOn(conflict.existing.updatedAt) }}<br />
            {{ t('Import geändert am') }} {{ changedOn(conflict.game.updatedAt) }}
          </p>
          <div class="save-menu-buttons">
            <input type="button" :value="t('Überschreiben')" @click="resolveConflict('overwrite')" />
            <input type="button" :value="t('Als Kopie anlegen')" @click="resolveConflict('copy')" />
            <input type="button" :value="t('Abbrechen')" @click="resetPanels" />
          </div>
        </template>
        <template v-else>
          <p>{{ t('Füge hier den Text eines exportierten Spiels ein.') }}</p>
          <textarea v-model="importText" class="save-menu-text" rows="4"></textarea>
          <p v-if="importMessage" class="save-menu-message">{{ importMessage }}</p>
          <div class="save-menu-buttons">
            <input type="button" :value="t('Importieren')" @click="runImport" />
            <input type="button" :value="t('Abbrechen')" @click="resetPanels" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
