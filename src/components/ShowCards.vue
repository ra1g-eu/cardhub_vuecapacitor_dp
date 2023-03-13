<template>
  <v-app-bar
      density="comfortable"
      color="black"
      app>
    <v-toolbar-title v-if="isSearch == false">Moje karty - {{ this.selectedCountry }}</v-toolbar-title>
    <v-toolbar-title v-else><v-text-field clearable single-line density="compact" class="mt-8 align-center" v-model="searchQuery" label="Názov karty" variant="solo"></v-text-field></v-toolbar-title>
    <v-btn icon="mdi-credit-card-search" border="0" variant="outlined" @click="searchForCard"></v-btn>
    <v-btn icon="mdi-logout" border="0" variant="outlined" @click="logOut"></v-btn>
  </v-app-bar>
  <v-snackbar
      v-model="snackbar"
      :timeout="2500"
      location="bottom"
      color="white">
    <span class="text-black">{{ snackBarText }}</span>
    <template v-slot:actions>
      <v-btn
          color="black"
          variant="flat"
          @click="snackbar = false"
      >
        Zatvoriť
      </v-btn>
    </template>
  </v-snackbar>
  <v-main>
    <v-container id="refreshCont" class="bg-yellow-darken-1">
      <v-row id="refreshCont" class="mt-5 mb-5">
        <div v-if="this.cardsArray == 'Zatiaľ nemáš žiadne karty!'">
          <strong>Zatiaľ nemáš žiadne karty!</strong>
        </div>

        <v-col
            v-else
            v-for="(card, index) in filterCards"
            :cols="filterCards.length >= 1 ? 6 : 12"
            xl="3"
            lg="4"
            sm="12"
            md="4"
            :key="index"
        >

          <v-card color="black" class="pa-0 ma-0">
            <v-card-title>{{ card.card_name }}
            </v-card-title>
            <v-card-text @click="this.$router.push({name: 'displayCard', params: {id: card.card_uuid}});">
              <v-img :src="card.shopLogo" alt="xd" style="object-fit: fill" height="125"></v-img>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>

  <v-bottom-navigation
      id="bottomNav"
      bg-color="black"
      grow>
    <v-btn
        class="pa-2"
        variant="text"
        @click="filterByCountry">
      <v-icon class="mb-1">mdi-swap-horizontal</v-icon>
      <span>{{ this.selectedCountry }}</span>
    </v-btn>
    <v-btn
        variant="text"
        @click="filterFreq">
      <v-icon :icon="filterFrequency === true ? 'mdi-order-numeric-ascending' : 'mdi-order-numeric-descending'"
              class="mb-1"></v-icon>
      <span>Zoradenie</span>
    </v-btn>
    <v-btn
        variant="text"
        @click="filterFavorite">
      <v-icon :icon="filterShowFavorite == false ? 'mdi-heart-outline' : 'mdi-heart'" class="mb-1"></v-icon>
      <span>Obľúbené</span>
    </v-btn>
    <!-- <v-menu
         v-model="filterMenu"
         :close-on-content-click="true"
         location="top"
     >
       <template v-slot:activator="{ props }">
         <v-btn
             variant="text"
             v-bind="props"
         >
           <span>Filtrovanie</span>
           <v-icon>mdi-cog</v-icon>
         </v-btn>
       </template>

       <v-card min-width="280">
         <v-list bg-color="black">
           <v-list-item
               subtitle="Krajina">
             <v-btn variant="outlined" size="small" density="compact" @click="filterByCountry" :value="this.selectedCountry">{{this.selectedCountry}}</v-btn>
           </v-list-item>
           <v-list-item
               subtitle="Zobraziť obľúbené">
             <v-btn variant="outlined" size="small" density="compact" @click="filterFavorite"><v-icon :icon="filterShowFavorite == false ? 'mdi-close' : 'mdi-check'" size="large"></v-icon></v-btn>
           </v-list-item>
           <v-list-item
               subtitle="Zoradiť podľa">
           </v-list-item>
           <v-list-item density="compact">
             <v-radio-group v-model="filterCardRadioButton" mandatory>
               <v-radio label="Frekvencia používania" value="filterFreq">
               </v-radio>
               <v-radio label="Názov" value="filterName">
               </v-radio>
             </v-radio-group>
           </v-list-item>
         </v-list>
         <v-card-actions class="bg-black" size="small">
           <v-btn variant="outlined" size="small" density="compact" color="white" append-icon="mdi-reload" @click="reloadCards" block>Obnoviť karty</v-btn>
         </v-card-actions>
       </v-card>
     </v-menu>
    !-->
    <v-btn
        class="pa-2"
        variant="text"
        @click="this.$router.push({path: '/nova-karta'});">
      <v-icon class="mb-1">mdi-credit-card-plus-outline</v-icon>
      <span>Nová karta</span>
    </v-btn>
  </v-bottom-navigation>
</template>
<script>
import Swal from "sweetalert2";
import PullToRefresh from 'pulltorefreshjs';
import {FirebasePerformance} from "@capacitor-firebase/performance";


export default {
  name: "ShowCards",
  data() {
    return {
      snackbar: false,
      snackBarText: '',
      ptr: null,
      filterShowFavorite: false,
      filterFrequency: false,
      filterMenu: false,
      selectShopDialog: false,
      cardIndexNotes: null,
      cardNotesText: '',
      cardIdDelete: '',
      cardIndexDelete: null,
      cardShops: [],
      selectedCountry: 'Slovensko',
      overlay: false,
      systemCodeName: '',
      cardsMessage: '',
      cardsArray: [],
      cardUrl: '',
      barcodeCodeToGen: '',
      searchQuery: '',
      isSearch: false,
    }
  },
  computed: {
    filterCards() {
      let filteredCards = this.cardsArray;

      if (this.searchQuery != '' && this.searchQuery) {
        filteredCards = filteredCards.filter((item) => {

          return item.card_name
              .toUpperCase()
              .includes(this.searchQuery.toUpperCase())

        });
      }

      if (this.selectedCountry == 'Slovensko') {
        filteredCards = filteredCards.filter((item) => {

          return item.country_name.includes(this.selectedCountry);

        });
      }

      if (this.selectedCountry != 'Slovensko') {
        filteredCards = filteredCards.filter((item) => {

          return !item.country_name.includes('Slovensko');

        });
      }
      if (this.filterShowFavorite) {
        localStorage.setItem('CardHub_ShowFavorite', 'true');
        filteredCards = filteredCards.filter((item) => {

          return item.isFavorite == true;

        });
      }
      if (this.filterFrequency) {
        localStorage.setItem('CardHub_SelectedFilter', 'filterFreqUp');
        filteredCards = filteredCards.sort((a, b) => {
          return (a.numberOfUses === undefined ? 0 : a.numberOfUses) - (b.numberOfUses === undefined ? 0 : b.numberOfUses);
        });
      }
      if (!this.filterFrequency) {
        localStorage.setItem('CardHub_SelectedFilter', 'filterFreqDown');
        filteredCards = filteredCards.sort((a, b) => {
          return (b.numberOfUses === undefined ? 0 : b.numberOfUses) - (a.numberOfUses === undefined ? 0 : a.numberOfUses);
        });
      }
      return filteredCards;
    }
  },
  methods: {
    async searchForCard(){
      await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/searchForCard'});
      this.isSearch = !this.isSearch;
      this.searchQuery = '';
      await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/searchForCard'});
    },
    async filterFreq() {
      await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/filterFreq'});
      this.filterFrequency = !this.filterFrequency;
      this.snackbar = true;
      this.snackBarText = this.filterFrequency ? 'Karty zoradené od najmenej používanej' : 'Karty zoradené od najpoužívanejšej';
      await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/filterFreq'});
    },
    async filterFavorite() {
      await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/filterFavorite'});
      this.filterShowFavorite = !this.filterShowFavorite;
      localStorage.setItem('CardHub_ShowFavorite', this.filterShowFavorite);
      await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/filterFavorite'});
    },
    async filterByCountry() {
      await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/filterByCountry'});
      if (this.selectedCountry === 'Česko') {
        this.selectedCountry = 'Slovensko'
        localStorage.setItem('CardHub_SelectedCountry', this.selectedCountry);
      } else {
        this.selectedCountry = 'Česko'
        localStorage.setItem('CardHub_SelectedCountry', this.selectedCountry);
      }
      await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/filterByCountry'});
    },
    async logOut() {
      try {
        Swal.fire({
          customClass: {
            container: 'codeFromImageSwal'
          },
          title: 'Odhlásenie',
          html: 'Práve si prihlásený ako <strong>' + this.systemCodeName + '</strong><br>Naozaj sa chceš odhlásiť?',
          icon: "warning",
          showCancelButton: true,
          cancelButtonText: 'Nie',
          confirmButtonText: 'OK',
        }).then(async (result) => {
          if (result.isConfirmed) {
            await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/logOut'});
            await this.$axios.get(this.$apiUrl + "api/cardhub/logOut/" + this.systemCodeName.trim().split('#')[0] + "/" + this.systemCodeName.trim().split('#')[1], {
              headers: {
                'Authorization': `SystemCode ${this.systemCodeName}`
              }
            }).then(async response => {
              if (response.data.status === 'error') {
                Swal.fire({
                  customClass: {
                    container: 'codeFromImageSwal'
                  },
                  title: 'Chyba',
                  html: 'Nepodarilo sa odhlásiť! Pravdepodobne nie si pripojený k internetu. \n Chyba: ' + response.data.message,
                  icon: "warning",
                  confirmButtonText: 'OK',
                }).then((result) => {
                  if (result.isConfirmed) {
                    Swal.close();
                  }
                });
              } else {
                await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/logOut/deleteLocalStorage'});
                localStorage.clear();
                await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/logOut/deleteLocalStorage'});
                this.$router.push({path: '/'});
              }
            }).catch(async err => {
              console.log(err.message);
              Swal.fire({
                customClass: {
                  container: 'codeFromImageSwal'
                },
                title: 'Chyba',
                html: 'Nepodarilo sa odhlásiť! Pravdepodobne nie si pripojený k internetu. \n Chyba: ' + err.message,
                icon: "warning",
                confirmButtonText: 'OK',
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.close();
                }
              });
              await this.addLogMessage('Axios logout error = ' + err.message);
              await this.setContext('ShowCards.vue', 'LogOut_Method', 'string');
              await this.recordException('No internet access when logging out! Axios crash.');
            });

          } else {
            Swal.close();
          }
        });
      } catch (e) {
        Swal.fire({
          customClass: {
            container: 'codeFromImageSwal'
          },
          title: 'Chyba',
          html: 'Neočakávaná chyba. Skús to prosím neskôr.',
          icon: "error",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
        await this.addLogMessage('Logout TryCatch error = ' + e);
        await this.setContext('ShowCards.vue', 'LogOut_Method', 'string');
        await this.recordException('Logout unexpected error caught in TryCatch.');
      } finally {
        await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/logOut'});
      }
    },
    showOverlay(url, code) {
      this.barcodeCodeToGen = code;
      this.cardUrl = url;
      this.overlay = true;
    },
    mergeObjectWithoutOverwriting(mainObject, objectToMerge) {
      Object.keys(objectToMerge).forEach(key => {
        if (!mainObject[key]) mainObject[key] = objectToMerge[key]
      })
      return mainObject
    },
    async getBase64Image(imgUrl, callback) {
      let img = new Image();
      img.onload = function(){
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        let dataURL = canvas.toDataURL("image/png");
        dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        callback(dataURL); // the base64 string
      };
      img.setAttribute('crossorigin', 'anonymous');
      img.src = imgUrl;
    },
    async reloadCards() {
      var responseData = [];
      try {
        await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/reloadCards'});
        await this.$axios.get(this.$apiUrl + "api/cardhub/getCards/" + this.systemCodeName.trim().split('#')[0] + "/" + this.systemCodeName.trim().split('#')[1], {
          headers: {
            'Authorization': `SystemCode ${this.systemCodeName}`
          }
        }).then(async response => {
          if (response.data.status === 'error') {
            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Chyba',
              html: 'Nepodarilo sa obnoviť karty! Pravdepodobne nie si pripojený k internetu. Karty neboli zmenené. \n Chyba: ' + response.data.message,
              icon: "warning",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
          } else {
            responseData = (response.data).toString();
            // ak novy ucet = 0 kariet = neulozit do localStorage
            if (!localStorage.getItem('CardHub_MyCards')) {
              await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/reloadCards/saveCardsForFirstTime'});
              localStorage.setItem('CardHub_MyCards', JSON.stringify(response.data.message));
              await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/reloadCards/saveCardsForFirstTime'});
            } else if(JSON.parse(localStorage.getItem('CardHub_MyCards')) === "Zatiaľ nemáš žiadne karty!" && response.data.message == "Zatiaľ nemáš žiadne karty!"){
              localStorage.setItem('CardHub_MyCards', "Zatiaľ nemáš žiadne karty!");
            } else {
              if(JSON.parse(localStorage.getItem('CardHub_MyCards')) === "Zatiaľ nemáš žiadne karty!" && response.data.message != "Zatiaľ nemáš žiadne karty!"){
                localStorage.setItem('CardHub_MyCards', JSON.stringify(response.data.message));
              }
              await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/reloadCards/parseCardsInJSON'});
              const parsed = Object.assign([], JSON.parse(localStorage.getItem('CardHub_MyCards')));

              const result = Object.assign([], response.data.message);

              let result2 = result.map((item, i) => Object.assign({}, item, parsed[i]));


              localStorage.setItem('CardHub_MyCards', JSON.stringify(result2));
              await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/reloadCards/parseCardsInJSON'});
            }

            let cards = JSON.parse(localStorage.getItem('CardHub_MyCards'));
            await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/reloadCards/ConvertImageToBase64'});
            for (let i = 0; i < cards.length; i++) {
              await this.getBase64Image(cards[i].shopLogo, function (base64image) {
                cards[i].shopLogo = base64image;
              });
            }
            await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/reloadCards/ConvertImageToBase64'});

            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Úspech!',
              html: 'Karty úspešne obnovené!',
              icon: "success",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
            await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/reloadCards/loadSavedCards'});
            this.cardsArray = JSON.parse(localStorage.getItem('CardHub_MyCards'));
            await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/reloadCards/loadSavedCards'});
          }
        }).catch(async err => {
          Swal.fire({
            customClass: {
              container: 'codeFromImageSwal'
            },
            title: 'Chyba',
            html: 'Nepodarilo sa obnoviť karty! Pravdepodobne nie si pripojený k internetu. Karty neboli zmenené. \n Chyba: ' + err.response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
          await this.addLogMessage('Axios reload cards error = ' + err.message);
          await this.setContext('ShowCards.vue', 'reloadCards_method', 'string');
          await this.recordException('Failed to download cards! Internet issue.');
        });
        this.showLoading = false;

      } catch (e) {
        Swal.fire({
          customClass: {
            container: 'codeFromImageSwal'
          },
          title: 'Chyba',
          html: 'Neočakávaná chyba. Skús to prosím neskôr.',
          icon: "error",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
        await this.addLogMessage('Reload cards TryCatch error = ' + e + " ("+responseData+")");
        await this.setContext('ShowCards.vue', 'reloadCards_method', 'string');
        await this.recordException('Error occured in TryCatch block!');
      } finally {
        await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/reloadCards'});
      }
    }
  },
  async created() {
    await FirebasePerformance.stopTrace({traceName: 'LoginPage.vue/ShowCards.vue/transitionTime'});
    document
        .getElementsByTagName('meta')
        .namedItem('viewport')
        .setAttribute('content', 'width=device-width,initial-scale=1.0,maximum-scale=1.0');
  },
  async mounted() {
    let _this = this;
    PullToRefresh.init({
      instructionsPullToRefresh: 'Potiahni dole pre obnovu kariet',
      instructionsReleaseToRefresh: 'Uvoľni pre obnovenie kariet',
      instructionsRefreshing: 'Obnovujem...',
      distReload: 110,
      distMax: 90,
      distThreshold: 80,
      mainElement: '#refreshCont',
      onRefresh() {
        _this.reloadCards();
      }
    });

    await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/mounted/loadFilters'});
    this.filterFrequency = (localStorage.getItem('CardHub_SelectedFilter') === 'filterFreqUp' ? true : false) ?? 'filterFreqUp';
    this.filterShowFavorite = localStorage.getItem('CardHub_ShowFavorite') ?? false;
    if (this.filterShowFavorite === 'true') {
      this.filterShowFavorite = true;
    }
    if (this.filterShowFavorite === 'false') {
      this.filterShowFavorite = false;
    }
    await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/mounted/loadFilters'});

    this.systemCodeName = localStorage.getItem('CardHub_LoginCode');
    this.selectedCountry = localStorage.getItem('CardHub_SelectedCountry') ?? 'Slovensko';

    await FirebasePerformance.startTrace({traceName: 'ShowCards.vue/mounted/parseCardsFromLocalStorage'});
    this.cardsArray = JSON.parse(localStorage.getItem('CardHub_MyCards'));
    await FirebasePerformance.stopTrace({traceName: 'ShowCards.vue/mounted/parseCardsFromLocalStorage'});

  },
  beforeUnmount() {
    PullToRefresh.destroyAll();
  }
}
</script>