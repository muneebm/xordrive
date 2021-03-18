<template>
  <q-layout view="lHh Lpr fFf"  style="user-select: none;">
    <q-header>
      <q-toolbar
        :class="{ 'bg-white': !$q.dark.isActive,'text-primary': !$q.dark.isActive,'q-pa-none': true }" >
        <q-btn color="secondary" flat round @click="left = !left" icon="menu" />
        <q-toolbar-title class="q-ml-xs q-mr-sm q-pa-none" >
          <q-input
            v-model="searchText"
            placeholder="Search drive"
            dense
            borderless
            input-class="text-weight-light">
              <template v-slot:prepend>
                <q-icon name="search"/>
              </template>
              <template v-if="searchText" v-slot:append>
                <q-icon name="clear" class="cursor-pointer" @click="searchText = ''" />
              </template>
            </q-input>
        </q-toolbar-title>
        <uploader
          class="all-pointer-events cursor-pointer"
          v-if="$q.platform.is.mobile"
          ref="upload"
          :directory="false"
          :multiple="true"
          :drop="false"
          @input="inputFiles"
          @input-file="inputFile" >
          <q-btn flat round color="secondary" icon="file_upload" />
        </uploader>
        <q-btn flat round class="q-mr-xs" icon="add" color="secondary" v-if="statusDisplay.type !== 1 && !$q.platform.is.mobile" >
          <q-menu self="top right" anchor="bottom middle" >
            <q-list separator link no-border class="q-pt-none q-pb-none">
              <q-item clickable v-close-popup @click.native="addNewFolder" class="q-pt-none q-pb-none">
                <q-item-section avatar>
                  <q-icon color="secondary"  name="create_new_folder"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label>Add folder</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.native="addFiles" class="q-pt-none q-pb-none">
                <q-item-section avatar>
                  <q-icon color="secondary"  name="file_upload"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label>Upload files</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.native="addFolders" class="q-pt-none q-pb-none">
                <q-item-section avatar>
                  <q-icon color="secondary"  name="cloud_upload"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label>Upload folders</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn
          outline
          round
          class="q-mr-xs"
          color="secondary"
          :icon="!profileImagePath ? 'person' : ''"
          size="sm">
          <q-avatar v-if="profileImagePath">
            <img :src="profileImagePath" />
          </q-avatar>
          <q-menu self="top right" anchor="bottom middle" >
            <q-list separator link no-border style="min-width: 100px">
              <q-item
                clickable
                v-close-popup>
                <q-item-section avatar>
                  <q-avatar size="24px">
                    <img v-if="profileImagePath" :src="profileImagePath" />
                    <q-icon color="secondary" v-if="!profileImagePath" name="fa fa-user" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label overline>
                    {{blockstack.isUserSignedIn() ? profileName : 'Login'}}
                  </q-item-label>
                  <q-item-label caption>
                    {{blockstack.isUserSignedIn() ? signedInUserName : ''}}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item
                clickable
                v-if="blockstack.isUserSignedIn()"
                v-close-popup @click.native="signOut()">
                <q-item-section avatar>
                  <q-icon color="secondary" name="power_settings_new" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    Logout
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-footer :class="{ 'bg-white': !$q.dark.isActive,'text-primary': !$q.dark.isActive, 'q-pb-sm': true }" v-if="$q.platform.is.mobile">
      <q-separator color="secondary" />
      <q-tabs no-caps active-color="secondary" indicator-color="transparent" class="text-grey" v-model="selectedTab" >
        <q-tab name="gaiahub" icon="storage" />
        <q-tab name="starred" icon="star" />
        <q-tab name="shares" icon="share" />
      </q-tabs>
    </q-footer>
    <q-drawer
      side="left"
      v-model="left"
      bordered
      class="no-scroll">
      <q-toolbar
        color="white" class="absolute-top">
        <q-avatar :size="$q.dark.isActive ? 'md' : ''" :rounded="$q.dark.isActive" :square="$q.dark.isActive" @click="selectedFolderId = 'gaiahub'" class="q-ml-sm q-pl-xs all-pointer-events cursor-pointer">
          <img :src="$q.dark.isActive ? 'statics/auth_logo.jpeg' : 'statics/logo_white_bg.jpeg'"  />
        </q-avatar>
      </q-toolbar>
      <q-scroll-area class="q-mt-xl side-bar" >
        <q-tree
          class="no-shadow q-mt-md"
          color="secondary"
          text-color="blue-grey-6"
          ref="foldersTree"
          :nodes="folders"
          node-key="id"
          accordion
          :selected.sync="selectedFolderId" >
        </q-tree>
        <div color="white" class="q-ma-lg text-overline text-weight-light" v-if="totalSizeUsedText">
            <div>
              {{ totalSizeUsedText }}
            </div>
            <q-linear-progress :value="totalSizeUsed / maximumFreeSize" color="secondary" />
        </div>
      </q-scroll-area>
      <q-toolbar
        color="white" class="absolute-bottom q-mb-sm">
        <q-toolbar-title class="text-overline text-weight-light">
            {{ copyright() }}
        </q-toolbar-title>
        <q-toggle
          :title="darkMode ? 'Switch to light mode': 'Switch to dark mode'"
          color="secondary"
          v-model="darkMode"
          checked-icon="fa fa-moon"
          unchecked-icon="fa fa-sun"/>
      </q-toolbar>
    </q-drawer>
    <q-page-container>
      <q-page class="fit">
        <q-separator />
        <div class="text-subtitle1 row justify-between no-wrap" >
          <q-breadcrumbs active-color="secondary" class="q-ma-sm q-pl-sm" >
            <q-breadcrumbs-el style="max-width: 20vw" class="all-pointer-events cursor-pointer" v-if="parentFolder" @click="selectedFolderId = parentFolder.id" >
              <div class="ellipsis">{{parentFolder.label}}</div>
            </q-breadcrumbs-el>
            <q-breadcrumbs-el style="max-width: 20vw" >
              <div class="ellipsis">{{selectedFolder.label}}</div>
            </q-breadcrumbs-el>
          </q-breadcrumbs>
          <div class="row justify-end float-left">
            <q-btn
              title="Share"
              v-if="!$q.platform.is.mobile && selected.length === 1 && selected[0].type !== 'folder' && selectedFolderId  !== 'shares' && selectedFolderId  !== 'trash'"
              color="secondary"
              flat round icon="share"
              @click.native="share" />
            <q-btn
              v-if="!$q.platform.is.mobile && selected.length"
              title="Download"
              color="secondary"
              flat
              round
              icon="cloud_download"
              @click.native="download(selected)"/>
            <q-btn
              title="Favorite"
              v-if="!$q.platform.is.mobile && selected.length && selectedFolderId  !== 'trash' && selectedFolderId  !== 'shares'"
              color="secondary"
              flat
              round
              icon="star"
              @click.native="starItems"/>
            <q-btn
              title="Move"
              color="secondary"
              flat
              round
              icon="forward"
              v-if="!$q.platform.is.mobile && selectedFolderId  !== 'shares' && selected.length"
              @click="showMovePopup = true" />
            <q-btn
              title="Rename"
              v-if="!$q.platform.is.mobile && selected.length === 1 && selectedFolderId  !== 'shares' && selectedFolderId !== 'trash'"
              color="secondary"
              flat
              round
              icon="edit"
              @click="renameItem" />
            <q-btn
              title="Restore"
              v-if="!$q.platform.is.mobile && selected.length && selectedFolderId === 'trash'"
              color="secondary"
              flat
              round
              icon="restore"
              @click.native="restoreSelectedItems" />
            <q-btn
              v-if="!$q.platform.is.mobile && selected.length && selectedFolderId  !== 'shares'"
              :title="selectedFolderId === 'trash' ? 'Delete permanently' : 'Trash'"
              color="secondary"
              flat round
              :icon="selectedFolderId === 'trash' ? 'delete_forever' : 'delete'"
              @click.native="deleteSelectedItems(selectedFolderId === 'trash')" />
            <q-btn
              v-if="!searchText && selectedItems.length && selectedFolderId === 'trash' && selected.length == 0"
              color="secondary"
              title="Empty trash"
              flat
              round
              icon="delete_sweep"
              @click.native="emptyTrash" />
            <q-btn
              v-if="!searchText && selectedItems.length && selectedFolderId === 'shares' && selected.length == 0"
              color="secondary"
              title="Refresh"
              flat
              round
              icon="refresh"
              @click.native="refreshShares" />
            <q-btn
              v-if="$q.platform.is.mobile && selected.length"
              color="secondary"
              title="More actions"
              flat
              round
              icon="expand_more"
              @click.native="showActionSheet" />
            <q-btn
              v-if="$q.platform.is.mobile && selectedFolderId !== 'shares' && selectedFolderId !== 'starred' && selectedFolderId !== 'trash'"
              color="secondary"
              title="Add folder"
              flat
              round
              icon="create_new_folder"
              @click.native="addNewFolder" />
            <q-btn
              v-if="$q.platform.is.mobile && selectedItems.length"
              color="secondary"
              title="Sort"
              flat
              round
              icon="sort"
              @click.native="showSortSheet" />
            <q-btn
              v-if="$q.platform.is.mobile && selectedItems.length"
              color="secondary"
              title="Change selection"
              flat
              round>
              <q-checkbox
                v-if="!searchText"
                :value="rowSelectionState"
                :color="rowSelectionState === false ? 'blue-grey-6' : 'secondary'"
                @input="toggleRowSelection" />
            </q-btn>
          </div>
        </div>
        <q-list>
          <q-item class="text-subtitle2" v-if="!$q.platform.is.mobile && selectedItems.length">
            <q-item-section side>
              <q-checkbox v-if="!searchText" :value="rowSelectionState"  :color="rowSelectionState === false ? 'blue-grey-6' : 'secondary'"  @input="toggleRowSelection" />
            </q-item-section>
            <q-item-section clickable>
              <div class="text-caption row no-wrap cursor-pointer" no-caps @click="sort.desc = sort.by === 'name' ? !sort.desc : false; sort.by = 'name'; ">
                <span>Name</span>
                <q-icon class="text-secondary q-pt-xs q-pl-xs" v-if="sort.by === 'name'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
              </div>
            </q-item-section>
            <q-item-section side style="width: 75px;" v-if="selectedFolderId !== 'shares'">
              <div class="text-caption row no-wrap cursor-pointer" no-caps @click="sort.desc = sort.by === 'size' ? !sort.desc : false; sort.by = 'size';">
                <q-icon class="text-secondary q-pt-xs q-pr-xs" v-if="sort.by === 'size'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
                <span>Size</span>
              </div>
            </q-item-section>
            <q-item-section side style="width: 120px;" v-if="selectedFolderId !== 'shares'">
              <div class="text-caption row no-wrap cursor-pointer" no-caps @click="sort.desc = sort.by === 'modified' ? !sort.desc : false; sort.by = 'modified';">
                <q-icon class="text-secondary q-pt-xs q-pr-xs" v-if="sort.by === 'modified'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
                <span>Last modified</span>
              </div>
            </q-item-section>
            <q-item-section side style="width: 180px;" v-if="selectedFolderId === 'shares'">
              <div class="text-caption row no-wrap cursor-pointer" no-caps @click="sort.desc = sort.by === 'owner' ? !sort.desc : false; sort.by = 'owner';">
                <q-icon class="text-secondary q-pt-xs q-pr-xs" v-if="sort.by === 'owner'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
                <span>Shared by</span>
              </div>
            </q-item-section>
            <q-item-section side style="width: 120px;" v-if="selectedFolderId === 'shares'">
              <div class="text-caption row no-wrap cursor-pointer" no-caps @click="sort.desc = sort.by === 'shared' ? !sort.desc : false; sort.by = 'shared';">
                <q-icon class="text-secondary q-pt-xs q-pr-xs" v-if="sort.by === 'shared'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
                <span>Shared date</span>
              </div>
            </q-item-section>
          </q-item>
          <q-scroll-area
            :thumb-style="thumbStyle"
            :bar-style="barStyle"
            :style="`height: calc(100vh - 160px);`" >
            <div v-for="item in selectedItems" :key="item.id">
              <q-separator />
              <q-item clickable
                @click.exact="$q.platform.is.mobile && selected.length === 0 ? rowClick(item) : rowSelected(item)"
                @click.ctrl="multiRowSelected(item)"
                @click.meta="multiRowSelected(item)"
                @dblclick.exact="rowClick(item)"
                @contextmenu="rightClick(item)"
                v-touch-hold="() => multiRowSelected(item)"
                :active="selected.includes(item)"
                :active-class="$q.dark.isActive ? 'bg-grey-8' : 'bg-blue-2'">
                <q-menu
                  touch-position
                  context-menu>
                  <q-list separator link no-border class="q-pt-none q-pb-none" v-if="selected.length">
                    <q-item
                      clickable
                      v-close-popup
                      @click.native="share"
                      v-if="!$q.platform.is.mobile && selected.length === 1 && selected[0].type !== 'folder' && selectedFolderId  !== 'shares' && selectedFolderId  !== 'trash'">
                      <q-item-section avatar>
                        <q-icon color="secondary"  name="share"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Share</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable v-close-popup
                      @click.native="download(selected)"
                      v-if="!$q.platform.is.mobile && selected.length">
                      <q-item-section avatar>
                        <q-icon color="secondary"  name="cloud_download"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Download</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable v-close-popup
                      @click.native="starItems"
                      v-if="!$q.platform.is.mobile && selected.length && selectedFolderId  !== 'trash' && selectedFolderId  !== 'shares'">
                      <q-item-section avatar>
                        <q-icon color="secondary"  name="star"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Favorite</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click.native="showMovePopup = true"
                      v-if="!$q.platform.is.mobile && selectedFolderId  !== 'shares' && selected.length">
                      <q-item-section avatar>
                        <q-icon color="secondary"  name="forward"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Move</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click.native="renameItem"
                      v-if="!$q.platform.is.mobile && selected.length === 1 && selectedFolderId  !== 'shares' && selectedFolderId !== 'trash'">
                      <q-item-section avatar>
                        <q-icon color="secondary"  name="edit"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Rename</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click.native="restoreSelectedItems"
                      v-if="!$q.platform.is.mobile && selected.length && selectedFolderId === 'trash'">
                      <q-item-section avatar>
                        <q-icon color="secondary" name="restore"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Restore</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click.native="deleteSelectedItems(selectedFolderId === 'trash')"
                      v-if="!$q.platform.is.mobile && selected.length && selectedFolderId  !== 'shares'">
                      <q-item-section avatar>
                        <q-icon color="secondary" :name="selectedFolderId === 'trash' ? 'delete_forever' : 'delete'"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{selectedFolderId === 'trash' ? 'Delete permanently' : 'Trash'}}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click.native="emptyTrash"
                      v-if="!searchText && selectedItems.length && selectedFolderId === 'trash' && selected.length == 0">
                      <q-item-section avatar>
                        <q-icon color="secondary" name="delete_sweep"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Empty trash</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click.native="refreshShares"
                      v-if="!searchText && selectedItems.length && selectedFolderId === 'shares' && selected.length == 0">
                      <q-item-section avatar>
                        <q-icon color="secondary" name="refresh"/>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Refresh</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
                <q-item-section avatar>
                  <q-avatar :text-color="selected.includes(item) ? 'secondary' : 'blue-grey-6'" :icon="getIcon(item.icon, item.type)" />
                </q-item-section>
                <q-item-section>
                  <div class="row no-wrap full-width">
                    <div
                      :class="{ ellipsis: true,  'col-auto': true,  'text-caption': true, 'text-white': selected.includes(item) && $q.dark.isActive }" style="max-width:90%; overflow-x: hidden;">
                      {{item.label}}
                    </div>
                    <div class="row no-wrap q-mt-xs">
                        <q-icon
                          class="q-ml-xs"
                          color="secondary"
                          v-if="item.star && selectedFolderId !== 'starred'"
                          name="star"/>
                        <q-icon
                          class="q-ml-xs"
                          color="secondary"
                          v-if="item.shared && item.shared.includes('public')"
                          name="public"/>
                        <q-icon
                          class="q-ml-xs q-mr-xs"
                          color="secondary"
                          v-if="item.shared && item.shared.length > 0 && !item.shared.includes('public')"
                          name="share"/>
                    </div>
                  </div>
                  <q-item-label v-if="$q.platform.is.mobile" caption>{{item.lastModified}}{{item.sizeText ? `, ${item.sizeText}` : ''}}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="$q.platform.is.mobile">
                  <q-btn
                    color="secondary"
                    title="More actions"
                    flat
                    round
                    icon="more_vert"
                    @click.stop="showActionSheet(item)" />
                </q-item-section>
                <q-item-section side style="width: 110px;" v-if="!$q.platform.is.mobile && selectedFolderId !== 'shares'">
                  <q-item-label caption>{{ item.sizeText || item.size }}</q-item-label>
                </q-item-section>
                <q-item-section side style="width: 110px;" v-if="!$q.platform.is.mobile && selectedFolderId !== 'shares'">
                  <q-item-label caption>{{item.lastModified}}</q-item-label>
                </q-item-section>
                <q-item-section side style="width: 180px;" v-if="!$q.platform.is.mobile && selectedFolderId === 'shares'" >
                  <q-item-label class="ellipsis" caption>{{item.owner}}</q-item-label>
                </q-item-section>
                <q-item-section side style="width: 100px;" v-if="!$q.platform.is.mobile && selectedFolderId === 'shares'" >
                  <q-item-label caption>{{item.sharedDate}}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </q-scroll-area>
        </q-list>
        <div class="row fit z-max dimmed justify-center" v-show="$refs.upload && $refs.upload.dropActive" >
          <q-icon name="arrow_upward" class="animate-bounce z-max" size="xl" />
          <div class="absolute-center text-weight-bold q-pa-md rounded-borders z-max" >
            Drop to upload
          </div>
        </div>
        <div class="absolute-center"
          v-if="selectedItems.length === 0 && !searchText">
          <div class="row q-ma-sm justify-center text-center text-subtitle1 text-weight-light">
            {{ `${selectedFolder.label} folder is empty`}}
          </div>
          <div v-if="!$q.platform.is.mobile && selectedFolderId !== 'trash' && selectedFolderId !== 'starred' && selectedFolderId !== 'shares'" class="row q-ma-sm justify-center text-center text-subtitle1 text-weight-light">
            Drag and drop files / folders to upload
          </div>
        </div>
        <status-popup />
        <uploader
          v-if="!$q.platform.is.mobile"
          ref="upload"
          :directory="true"
          :multiple="true"
          :drop="true"
          @input="inputFiles"
          @input-file="inputFile"/>
        <preview :open.sync="openPreview" :item.sync="previewFile" />
        <share-modal :item.sync="selected[0]" :show.sync="showShareModal" />
        <q-dialog v-model="showMovePopup" seamless position="bottom">
          <div :class="{ 'bg-white': !$q.dark.isActive, 'bg-dark': $q.dark.isActive }">
            <div class="row justify-between q-mb-xs no-wrap" >
              <q-btn
                class="q-pa-none"
                size="sm"
                flat
                round
                icon="fas fa-chevron-left"
                color="secondary"
                @click.native="moveToFolderId = selectedMoveFolder.folderId !== 'xor' ? selectedMoveFolder.folderId : moveToFolderId"/>
              <div v-if="selectedMoveFolder" class="ellipsis text-subtitle1 q-mt-xs q-mb-xs">{{selectedMoveFolder.label}}</div>
              <q-btn
                class="q-pa-none"
                size="sm"
                flat
                round
                icon="close"
                color="secondary"
                v-close-popup
                @click.native="showMovePopup = false"/>
            </div>
            <q-scroll-area
              class="folderTreeDesktop">
              <q-table
                style="width: 100%"
                bordered
                dense
                class="no-shadow"
                :data="moveToFolders"
                :columns="columns"
                :visible-columns="['name']"
                color="secondary"
                row-key="id"
                separator="horizontal"
                hide-header
                hide-bottom>
                <template slot="body" slot-scope="props">
                  <q-tr
                    :props="props"
                    :class="{ 'cursor-pointer': true }">
                    <q-td
                      v-for="col in props.cols"
                      :key="col.name"
                      :props="props"
                      @click.native="moveToFolderId = props.row.id">
                      <div :class="{ row: true, 'justify-left': true, 'ellipsis': true }" >
                        <div class="q-pa-xs" >
                          {{ col.value }}
                        </div>
                      </div>
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
              <div class="q-ma-xl text-center full-width" v-if="moveToFolders.length == 0">
                Empty folder
              </div>
            </q-scroll-area>
            <q-separator />
            <div class="row justify-between q-mt-xs full-width" >
              <q-btn
                class="q-mr-xs"
                color="secondary"
                round
                flat
                @click.prevent="displayNewFolderToMove"
                icon="create_new_folder" />
              <q-input
                ref="newFolderInput"
                dense
                borderless
                autofocus
                @focus="newFolderFocus"
                v-if="createNewMoveFolder"
                v-model="newFolderToMove.label" />
              <q-btn
                class="q-ml-xs"
                color="secondary"
                round
                flat
                v-if="createNewMoveFolder && newFolderToMove.label !== ''"
                @click.prevent="addNewFolderToMove"
                icon="check" />
            </div>
            <div class="row justify-end q-mt-xs">
              <q-btn
                flat round label="OK"
                :disable="!moveToFolderId"
                color="secondary"
                v-close-popup
                @click.native="moveSelectedItems" />
            </div>
          </div>
        </q-dialog>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import Uploader from '../components/Uploader.vue'
import StatusPopup from '../components/StatusPopup'
import Preview from '../components/Preview'
import ShareModal from '../components/ShareModal'
import { scroll, openURL } from 'quasar'
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
const { getScrollTarget, setScrollPosition } = scroll
export default {
  name: 'Drive',
  components: {
    Uploader,
    StatusPopup,
    Preview,
    ShareModal
  },
  data () {
    return {
      selectedTab: '',
      sort: {
        by: '',
        desc: false
      },
      openPreview: false,
      left: true,
      searchText: '',
      prevSelectedFolderId: '',
      columns: [
        {
          name: 'name',
          required: true,
          label: 'Name',
          align: 'left',
          field: 'label',
          sortable: true
        },
        {
          name: 'owner',
          label: 'Shared by',
          align: 'left',
          field: 'owner',
          sortable: true
        },
        {
          name: 'lastModified',
          label: 'Modified',
          field: 'lastModified',
          sortable: true,
          align: 'left'
        },
        {
          name: 'sharedDate',
          label: 'Shared date',
          field: 'sharedDate',
          sortable: true,
          align: 'left'
        },
        {
          name: 'size',
          label: 'Size',
          field: 'size',
          sortable: true,
          align: 'left'
        }
      ],
      pagination: {
        rowsPerPage: 0
      },
      selected: [],
      filter: '',
      newFolderToMove: {},
      moveToFolderId: '',
      showMovePopup: false,
      createNewMoveFolder: false,
      showShareModal: false,
      previewFile: null
    }
  },
  created () {
    this.openPreview = false
    if (this.blockstack.isUserSignedIn()) {
      this.setup()
      this.getFolderRecords()
      this.getFileRecords()
    }
  },
  mounted () {
    if (this.blockstack.isUserSignedIn()) {
      this.updateShareRecords()
      this.selectedFolderId = 'gaiahub'
      this.selectedFolderChanged('gaiahub')
    }
  },
  watch: {
    showMovePopup: function (value) {
      if (!value) {
        this.moveToFolderId = ''
        this.newFolderToMove = {}
        this.createNewMoveFolder = false
      }
    },
    moveToFolderId: function (value) {
      if (value !== this.newFolderToMove.id) {
        this.createNewMoveFolder = false
      }
      if (value) {
        let folderInSelectedItems = this.selected.filter(f => f.id === value)
        if (folderInSelectedItems.length > 0) {
          this.moveToFolderId = ''
          this.$q.notify({ message: 'Invalid target folder', color: 'negative' })
        }
      }
    },
    selectedTab: function (value) {
      this.selectedFolderId = value
    }
  },
  computed: {
    ...mapState('blockstack', [
      'session',
      'folderRecords',
      'fileRecords',
      'signedInUserData',
      'removedFiles',
      'statusDisplay',
      'settings',
      'sharedWithMe',
      'signedInUserName',
      'totalSizeUsed',
      'maximumFreeSize',
      'totalSizeUsedText']),
    ...mapGetters('blockstack', [
      'signedInUserProfile']),
    darkMode: {
      get: function () {
        return this.settings.darkMode
      },
      set: function (newValue) {
        if (newValue !== this.settings.darkMode) {
          this.setDarkMode(newValue)
          this.$q.localStorage.set('darkMode', newValue)
        }
      }
    },
    blockstack () {
      return this.session
    },
    filesInSelectedFolder () {
      return [...this.fileRecords.values()].filter(fr => fr && fr.folderId === this.selectedFolderId)
    },
    folders () {
      return [...this.folderRecords.values()].filter(fr => fr && (fr.folderId === 'xor' || !fr.folderId))
    },
    moveToFolders () {
      if (this.moveToFolderId) {
        return [...this.folderRecords.values()].filter(fr => fr && fr.folderId === this.moveToFolderId)
      } else {
        return [this.folderRecords.get('gaiahub')]
      }
    },
    selectedFolderId: {
      get: function () {
        return this.$store.state.blockstack.selectedFolderId
      },
      set: function (newValue) {
        if (this.selectedFolderId !== newValue) {
          this.selectedFolderChanged(newValue)
        }
      }
    },
    selectedFolder () {
      return this.folderRecords.get(this.selectedFolderId)
    },
    parentFolder () {
      return this.folderRecords.get(this.selectedFolder.folderId)
    },
    selectedMoveFolder () {
      return this.folderRecords.get(this.moveToFolderId ? this.moveToFolderId : 'gaiahub')
    },
    selectedItems () {
      let items = []
      if (this.searchText) {
        items = [...this.filteredFolders(), ...[...this.fileRecords.values()].filter(fr => fr && fr.label && fr.label.toLowerCase().includes(this.searchText.toLowerCase()))]
      } else if (this.selectedFolderId === 'starred') {
        items = [...this.starredFolders(), ...[...this.fileRecords.values()].filter(fr => fr && fr.star && fr.folderId !== 'trash')]
      } else if (this.selectedFolderId === 'shares') {
        items = [...this.selectedSubfolders, ...this.filesInSelectedFolder, ...[...this.fileRecords.values()].filter(fr => fr && fr.shared && fr.shared.length > 0)]
      } else {
        items = [...this.selectedSubfolders, ...this.filesInSelectedFolder]
      }
      if (this.sort.by) {
        if (this.sort.by === 'name') {
          items = items.sort((a, b) => a.label.localeCompare(b.label))
        } else if (this.sort.by === 'modified') {
          items = items.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified))
        } else if (this.sort.by === 'size') {
          items = items.sort((a, b) => a.size - b.size)
        }
        if (this.sort.desc) {
          items = items.reverse()
        }
      }
      return items
    },
    selectedSubfolders () {
      let result = []
      if (this.selectedFolderId) {
        result = [...this.folderRecords.values()].filter(fr => fr && fr.folderId === this.selectedFolderId)
      }
      return result
    },
    profileImagePath () {
      // var imagePath = this.$q.dark.isActive ? '' : 'statics/avatar-placeholder.png'
      // const profile = this.$store.getters['blockstack/signedInUserProfile']
      // if (profile && profile.avatarUrl()) {
      //   imagePath = profile.avatarUrl()
      // }
      return ''
    },
    profileName () {
      var name = ''
      const profile = this.signedInUserProfile
      if (profile && profile.name()) {
        name = profile.name()
      }
      return name
    },
    visibleColumns () {
      if (this.$q.screen.lt.sm) {
        return ['name']
      } else if (this.selectedFolderId === 'shares') {
        return ['name', 'owner', 'sharedDate']
      } else {
        return ['name', 'lastModified', 'size']
      }
    },
    rowSelectionState () {
      let state = false
      if (this.selected.length) {
        state = this.selectedItems.length === this.selected.length ? true : null
      }
      return state
    },
    thumbStyle () {
      return {
        right: '4px',
        borderRadius: '5px',
        backgroundColor: '#027be3',
        width: '3px',
        opacity: 0.75
      }
    },
    barStyle () {
      return {
        right: '1px',
        borderRadius: '9px',
        backgroundColor: '#027be3',
        opacity: 0.2
      }
    }
  },
  methods: {
    ...mapActions('blockstack', [
      'updateFileRecords',
      'updateFolderRecords',
      'setup',
      'getFileRecords',
      'getFolderRecords',
      'updateShareRecords',
      'searchProfile',
      'getFileContent',
      'downloadFile',
      'download',
      'setStatusData',
      'setDarkMode',
      'saveFolderRecord',
      'removeSelectedItems'
    ]),
    ...mapMutations('blockstack', [
      'setFileRecord',
      'setSelectedFolderId',
      'setSignedInUserData',
      'setSignedInUsername',
      'setFolderRecord',
      'removeFileRecord']),
    openPreviewDialog (item) {
      if (item) {
        this.openPreview = true
        this.previewFile = item
      }
    },
    selectedFolderChanged (value) {
      this.selected = []
      if (value) {
        this.searchText = ''
        this.prevSelectedFolderId = value
        if (this.$q.platform.is.mobile) {
          this.left = false
        }
        this.setSelectedFolderId(value)
        this.selectedFolder.opened = this.getFormattedDate()
        window.document.title = this.selectedFolder.label
      } else {
        this.selectedFolderId = this.prevSelectedFolderId
      }
      if (this.selectedFolderId === 'shares') {
        this.refreshShares()
      }
      if (this.selectedFolderId === 'gaiahub' ||
          this.selectedFolderId === 'shares' ||
          this.selectedFolderId === 'starred') {
        this.selectedTab = this.selectedFolderId
      }
    },
    refreshShares () {
      this.sharedWithMe.forEach(async item => {
        try {
          const fileDataString = await this.blockstack.getFile(
            this.signedInUserName,
            { username: item })
          if (fileDataString) {
            this.removeFilesFromUser(item)
            let fileData = JSON.parse(fileDataString)
            fileData.forEach(file => {
              this.setFileRecord(file)
            })
          }
        } catch (error) {
          console.log(error)
          // this.$q.notify({ message: 'Failed to open file', color: 'negative' })
        }
      })
      this.updateFileRecords()
    },
    rowClick (row) {
      if (row.type === 'folder') {
        this.searchText = ''
        this.selectedFolderId = row.id
      } else {
        this.openPreviewDialog(row)
      }
    },
    rightClick (item) {
      if (!this.selected.includes(item)) {
        this.selected = [item]
      }
    },
    rowSelected (item) {
      if (this.selected.includes(item)) {
        this.selected = this.selected.filter(value => {
          return value.id !== item.id
        })
      } else {
        this.selected = [item]
      }
    },
    multiRowSelected (item) {
      if (this.selected.includes(item)) {
        this.selected = this.selected.filter(value => {
          return value.id !== item.id
        })
      } else {
        this.selected.push(item)
      }
    },
    toggleRowSelection () {
      if (this.selected.length) {
        this.selected = []
      } else {
        this.selectedItems.forEach(item => {
          this.selected.push(item)
        })
      }
    },
    touchHold (props) {
      props.selected = !props.selected
    },
    signOut () {
      if (this.blockstack.isUserSignedIn()) {
        this.blockstack.signUserOut()
        this.setSignedInUserData(null)
        this.setSignedInUsername('')
        this.$q.notify({ message: 'Signed out from xordrive', color: 'primary' })
        this.$router.push('/start')
      }
    },
    searchItemSelected (item, keyboard) {
      this.selectedFolderId = item.folderId
      this.searchText = ''
    },
    openProfile () {
      openURL(`https://explorer.blockstack.org/name/${this.signedInUserName}`)
    },
    newFolderFocus () {
      this.$refs.newFolderInput.focus()
    },
    displayNewFolderToMove () {
      this.newFolderToMove.label = 'Untitled folder'
      this.newFolderToMove.id = 'newfoldertomove'
      this.createNewMoveFolder = true
    },
    addNewFolderToMove () {
      if (this.newFolderToMove.id === 'newfoldertomove' &&
          this.newFolderToMove.label) {
        let newFolder = this.getNewFolder(String(this.newFolderToMove.label), this.moveToFolderId)
        this.setFolderRecord(newFolder)
        this.moveToFolderId = newFolder.id
        this.bringNewMoveToFolderToView()
        this.updateFolderRecords()
        this.newFolderToMove.label = ''
        this.createNewMoveFolder = false
      }
    },
    addNewFolder () {
      if (this.selectedFolderId === 'trash' ||
          this.selectedFolderId === 'starred') {
        this.selectedFolderId = 'gaiahub'
      }
      if (this.selectedFolder) {
        this.$q.dialog({
          title: 'New folder',
          prompt: {
            model: '',
            type: 'text'
          },
          ok: 'Save',
          cancel: true,
          color: 'secondary'
        }).onOk(newName => {
          this.addNewFolderInGaia(newName)
        }).onCancel(() => {})
      }
    },
    addNewFolderInGaia (newName) {
      if (newName) {
        let newFolder = this.getNewFolder(newName, this.selectedFolderId)
        this.saveFolderRecord(newFolder)
      }
    },
    bringNewMoveToFolderToView () {
      const tree = document.getElementById('moveToFoldersTree')
      if (tree) {
        const lastChild = tree.lastChild
        if (lastChild) {
          let target = getScrollTarget(lastChild)
          let offset = lastChild.offsetTop - lastChild.scrollHeight
          let duration = 1000
          setScrollPosition(target, offset, duration)
        }
      }
    },
    renameItem () {
      if (this.selected.length !== 1) {
        return
      }
      let item = this.selected[0]
      this.$q.dialog({
        title: 'Rename',
        prompt: {
          model: item.label,
          type: 'text' // optional
        },
        cancel: true,
        color: 'secondary'
      }).onOk(newName => {
        if (newName) {
          item.label = newName
          if (item.type === 'folder') {
            this.updateFolderRecords()
          } else {
            this.updateFileRecords()
          }
        }
        this.selected = []
      }).onCancel(() => {
      })
    },
    deleteSelectedItems (confirm) {
      if (confirm) {
        let message = this.selectedFolderId === 'trash'
          ? 'Are you sure you want to delete the selected items permanently?'
          : 'Move the selected items to Trash?'
        let title = this.selectedFolderId === 'trash' ? 'Delete permanently' : 'Trash'
        this.$q.dialog({
          title: title,
          message: message,
          ok: 'Yes',
          cancel: 'No',
          color: 'secondary'
        }).onOk(() => {
          this.deleteSelectedItems(false)
        }).onCancel(() => {
        })
      } else {
        if (this.selectedFolderId === 'trash') {
          this.removeSelectedItems(this.selected)
          this.selected = []
        } else {
          this.moveToFolderId = 'trash'
          this.moveSelectedItems()
        }
      }
    },
    restoreSelectedItems () {
      this.selected.forEach(item => {
        if (item.type === 'folder') {
          if (item.restore) {
            if (this.folderRecords.has(item.restore)) {
              item.folderId = item.restore
              item.restore = ''
              this.setFolderRecord(item)
            } else {
              this.setActionStatus(`Failed to restore ${item.label}`, 3)
            }
          }
        } else {
          if (item.restore) {
            item.folderId = item.restore
            item.restore = ''
            this.setFileRecord(item)
          }
        }
      })
      this.setActionStatus('Restored the selected item(s)', 2)
      this.updateFileRecords()
      this.updateFolderRecords()
      this.selected = []
    },
    emptyTrash () {
      this.$q.dialog({
        title: 'Empty trash',
        message: 'Permanently delete all items in Trash?',
        ok: 'Yes',
        cancel: 'No',
        color: 'secondary'
      }).onOk(() => {
        this.selected = [...this.selectedItems]
        this.deleteSelectedItems(false)
      }).onCancel(() => {
      })
    },
    moveSelectedItems () {
      this.showMovePopup = false
      if (!this.moveToFolderId) {
        return
      }
      this.selected.forEach(item => {
        if (this.moveToFolderId === 'trash') {
          item.restore = item.folderId
        }
        item.folderId = this.moveToFolderId
        if (item.type === 'folder') {
          this.setFolderRecord(item)
        } else {
          this.setFileRecord(item)
        }
      })
      this.setActionStatus(`Moved the selected item(s) to ${this.selectedMoveFolder.label}`, 2)
      this.updateFileRecords()
      this.updateFolderRecords()
      this.selected = []
      this.moveToFolderId = ''
    },
    inputFile (newFile, oldFile) {
      if (newFile && !oldFile) {
        this.setActionStatus(`Uploading ${newFile.file.name} ...`, 1)
      }

      if (newFile && oldFile) {
        if (newFile.active !== oldFile.active) {
          this.setActionStatus(`Uploading ${newFile.file.name} ...`, 1, 0)
        }

        // Upload progress
        if (newFile.progress !== oldFile.progress) {
          this.setActionStatus(`Uploading ${newFile.file.name} ...`, 1, newFile.progress)
        }

        // Upload error
        if (newFile.success === false && newFile.error !== oldFile.error) {
          this.setActionStatus(`Upload failed ${newFile.file.name} ...`, 3)
          this.$refs.upload.remove(newFile.id)
        }

        // Uploaded successfully
        if (newFile.success && (newFile.success !== oldFile.success)) {
          this.setActionStatus(`Uploaded ${newFile.file.name} ...`, 1)
          this.setFileRecord(newFile.record)
          this.$refs.upload.remove(newFile.id)
        }
      }

      // Automatic upload
      if (Boolean(newFile) !== Boolean(oldFile) || oldFile.error !== newFile.error) {
        if (!this.$refs.upload.active) {
          this.$refs.upload.active = true
        }
      }
      if (newFile && newFile.success && this.$refs.upload.files.length === 0) {
        this.updateFileRecords()
        this.updateFolderRecords()
        this.setActionStatus('Upload completed', 2)
      }
    },
    inputFiles (selectedFiles) {
      if (selectedFiles.length === 0) {
        return
      }
      if (this.selectedFolderId === 'trash' ||
          this.selectedFolderId === 'starred') {
        this.selectedFolderId = 'gaiahub'
      }
      this.selectedFolder.lastModified = this.getFormattedDate()
    },
    share () {
      this.showShareModal = true
    },
    setActionStatus (message, status, progress) {
      let display = false
      if (!this.statusDisplay.display && status === 1) {
        display = true
      } else {
        display = this.statusDisplay.display
      }
      let data = {
        display: display,
        message: message,
        type: status
      }
      if (progress) {
        data.progress = progress
      }
      this.setStatusData(data)
    },
    starItems () {
      if (this.selectedFolderId === 'starred') {
        this.selected.forEach(item => {
          item.star = false
        })
      } else {
        if (this.selected.length === 1) {
          this.selected[0].star = !this.selected[0].star
        } else {
          this.selected.forEach(item => {
            item.star = true
          })
        }
      }
      this.updateFileRecords()
      this.updateFolderRecords()
    },
    starredFolders () {
      return [...this.folderRecords.values()].filter(f => f && f.star && f.folderId !== 'trash')
    },
    filteredFolders () {
      return [...this.folderRecords.values()].filter(fr => fr && fr.label && fr.folderId && fr.folderId !== 'xor' && fr.label.toLowerCase().includes(this.searchText.toLowerCase()))
    },
    getFilesInFolder (folderId) {
      return [...this.fileRecords.values()].filter(fr => fr && fr.folderId === folderId)
    },
    removeFilesFromUser (username) {
      let filesFromUser = [...this.fileRecords.values()].filter(fr => fr && fr.owner === username)
      if (filesFromUser) {
        filesFromUser.forEach(file => {
          this.removeFileRecord(file.id)
        })
      }
    },
    addFiles () {
      let input = this.$refs.upload.$el.querySelector('input')
      input.directory = false
      input.webkitdirectory = false
      input.onclick = null
      input.click()
    },
    addFolders () {
      if (!this.$refs.upload.features.directory) {
        this.$q.notify({ message: 'Your browser does not support folder upload', color: 'negative' })
        return
      }
      let input = this.$refs.upload.$el.querySelector('input')
      input.directory = true
      input.webkitdirectory = true
      input.onclick = null
      input.click()
    },
    showActionSheet (item) {
      if (item && item.id) {
        this.selected = [item]
      }
      if (!this.selected.length) {
        return
      }
      let message = this.selected.length === 1 ? this.selected[0].label : `${this.selected.length} items`
      let actions = [
        {},
        {
          label: 'Download',
          icon: 'cloud_download',
          color: 'secondary',
          id: 'download'
        }]
      if (this.selectedFolderId !== 'shares') {
        if (this.selectedFolderId !== 'trash') {
          if (this.selected.length === 1) {
            if (this.selected[0].type !== 'folder') {
              actions.push({
                label: 'Share',
                icon: 'share',
                color: 'secondary',
                id: 'share'
              })
            }
            actions.push({
              label: 'Rename',
              icon: 'edit',
              color: 'secondary',
              id: 'rename'
            })
          }
          actions.push({
            label: 'Favorite',
            icon: 'star',
            color: 'secondary',
            id: 'favorite'
          })
        }
        actions.push({
          label: this.selectedFolderId === 'trash' ? 'Delete permanently' : 'Trash',
          icon: this.selectedFolderId === 'trash' ? 'delete_forever' : 'delete',
          color: 'secondary',
          id: 'delete'
        })
        actions.push({
          label: 'Move',
          icon: 'forward',
          color: 'secondary',
          id: 'move'
        })
      }
      if (this.selectedFolderId === 'trash') {
        actions.push({
          label: 'Restore',
          icon: 'restore',
          color: 'secondary',
          id: 'restore'
        })
      }
      this.$q.bottomSheet({
        message: message,
        grid: false,
        actions: actions
      }).onOk(action => {
        switch (action.id) {
          case 'share':
            this.share()
            break
          case 'download':
            this.download(this.selected)
            break
          case 'rename':
            this.renameItem()
            break
          case 'delete':
            this.deleteSelectedItems(this.selectedFolderId === 'trash')
            break
          case 'move':
            this.showMovePopup = true
            break
          case 'restore':
            this.restoreSelectedItems()
            break
          case 'favorite':
            this.starItems()
            break
        }
      })
    },
    showSortSheet () {
      let icon = (this.sort.desc ? 'arrow_downward' : 'arrow_upward')
      let actions = [
        {},
        {
          label: 'Name',
          icon: `${this.sort.by === 'name' ? icon : ''}`,
          color: 'secondary',
          id: 'name'
        },
        {
          label: 'Size',
          icon: `${this.sort.by === 'size' ? icon : ''}`,
          color: 'secondary',
          id: 'size'
        },
        {
          label: 'Last modified',
          icon: `${this.sort.by === 'modified' ? icon : ''}`,
          color: 'secondary',
          id: 'modified'
        }
      ]
      this.$q.bottomSheet({
        message: 'Sort',
        grid: false,
        actions: actions
      }).onOk(action => {
        this.sort.desc = this.sort.by === action.id ? !this.sort.desc : false
        this.sort.by = action.id
      })
    }
  }
}
</script>

<style>
  .side-bar {
    height: calc(100vh - 50px);
  }
  .fill {
    width: 100%;
    height: calc(100vh - 36px);
    min-height: calc(100vh - 36px);
  }
  .avatar {
    border-radius: 50%;
  }
  .search-box {
    font-size: medium;
    font-weight: 600;
  }
  .folderTreeMobile {
    height: 150px;
    width: 198px;
  }
  .folderTreeDesktop {
    height: 175px;
    min-width: 300px;
    width: 100%;
  }
  .dotted-border {
    border: 0.25px dotted;
  }
  .blockstack-link:hover {
    cursor: pointer;
  }
</style>
