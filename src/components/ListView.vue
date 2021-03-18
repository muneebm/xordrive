<template>
  <div>
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
        <q-checkbox v-if="showCheckbox" :value="rowSelectionState"  :color="rowSelectionState === false ? 'blue-grey-6' : 'secondary'"  @input="toggleRowSelection" />
      </q-item-section>
      <q-item-section @mouseover="sort.show = 'name';" @mouseleave="sort.show = ''" clickable>
        <div class="text-caption row no-wrap" no-caps @click="sort.by = 'name'; sort.desc = !sort.desc;">
          <span>Name</span>
          <q-icon class="text-secondary q-pt-sm q-pl-xs" v-if="sort.show === 'name'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
        </div>
      </q-item-section>
      <q-item-section side style="width: 75px;" @mouseover="sort.show = 'size';" @mouseleave="sort.show = ''" v-if="selectedFolderId !== 'shares'">
        <div class="text-caption row no-wrap" no-caps @click="sort.by = 'size'; sort.desc = !sort.desc;">
          <q-icon class="text-secondary q-pt-sm q-pr-xs" v-if="sort.show === 'size'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
          <span>Size</span>
        </div>
      </q-item-section>
      <q-item-section side style="width: 120px;" @mouseover="sort.show = 'modified'" @mouseleave="sort.show = ''" v-if="selectedFolderId !== 'shares'">
        <div class="text-caption row no-wrap" no-caps @click="sort.by = 'modified'; sort.desc = !sort.desc;">
          <q-icon class="text-secondary q-pt-sm q-pr-xs" v-if="sort.show === 'modified'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
          <span>Last modified</span>
        </div>
      </q-item-section>
      <q-item-section side style="width: 180px;" @mouseover="sort.show = 'owner'" @mouseleave="sort.show = ''" v-if="selectedFolderId === 'shares'">
        <div class="text-caption row no-wrap" no-caps @click="sort.by = 'owner'; sort.desc = !sort.desc;">
          <q-icon class="text-secondary q-pt-sm q-pr-xs" v-if="sort.show === 'owner'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
          <span>Shared by</span>
        </div>
      </q-item-section>
      <q-item-section side style="width: 120px;" @mouseover="sort.show = 'shared'" @mouseleave="sort.show = ''" v-if="selectedFolderId === 'shares'">
        <div class="text-caption row no-wrap" no-caps @click="sort.by = 'shared'; sort.desc = !sort.desc;">
          <q-icon class="text-secondary q-pt-sm q-pr-xs" v-if="sort.show === 'shared'" :name="sort.desc ? 'arrow_downward' : 'arrow_upward'" />
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
  </div>
</template>

<script>
export default {
  name: 'ListView',
  props: {
    showCheckbox: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object
    }
  },
  data () {
    return {}
  }
}
</script>
