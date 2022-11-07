<template>
    <v-system-bar color="black" window app>
      Prihlásený ako {{this.systemCodeName}} <v-icon icon="mdi-account-check"></v-icon>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-logout" border="0" variant="outlined" @click="logOut"></v-btn>
    </v-system-bar>
      <v-container id="contMain" class="bg-yellow-darken-1">
        <v-row class="mt-5 mb-5">
          <div v-if="this.cardsArray == 'Zatiaľ nemáš žiadne karty!'">
            <strong>Zatiaľ nemáš žiadne karty!</strong>
          </div>
            <v-col
                v-else
                v-for="(card, index) in filterCards"
                :cols="filterCards.length > 2 ? 6 : 12"
                xl="3"
                lg="4"
                sm="12"
                md="4"
                :key="index"
            >
              <v-card color="black" class="pa-0 ma-0">
                <v-card-title>{{card.card_name}}
                </v-card-title>
                <v-card-text @click="this.$router.push({name: 'displayCard', params: {id: card.card_uuid}});">
                  <v-img :src="card.shopLogo" alt="xd" style="object-fit: fill" height="125"></v-img>
                </v-card-text>
              </v-card>
            </v-col>
        </v-row>
      </v-container>
  <v-bottom-navigation
      id="bottomNav"
      bg-color="black"
      hide-on-scroll
      grow
      scroll-target="#contMain">
    <v-btn
        variant="text"
        @click="this.$router.push({path: '/prevodnik'});">
      <span>Prevodník</span>
      <v-icon>mdi-currency-eur</v-icon>
    </v-btn>

    <v-menu
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

    <v-btn
        variant="text"
        @click="this.$router.push({path: '/nova-karta'});">
      <span>Nová karta</span>

      <v-icon>mdi-credit-card-plus-outline</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>


<script>
import Swal from "sweetalert2";

export default {
  name: "ShowCards",
  data(){
    return{
      filterShowFavorite: false,
      filterCardRadioButton: null,
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
      barcodeCodeToGen: ''
    }
  },
  computed:{
    filterCards(){
      let filteredCards = this.cardsArray;

      if (this.selectedCountry == 'Slovensko') {
        filteredCards = filteredCards.filter((item) => {

          return item.country_name.includes(this.selectedCountry);

        });
      }

      if(this.selectedCountry != 'Slovensko') {
        filteredCards = filteredCards.filter((item) => {

          return !item.country_name.includes('Slovensko');

        });
      }
      if(this.filterShowFavorite) {
        localStorage.setItem('CardHub_ShowFavorite', 'true');
        filteredCards = filteredCards.filter((item) => {

          return item.isFavorite == true;

        });
      }
      if (this.filterCardRadioButton === 'filterName') {
        localStorage.setItem('CardHub_SelectedFilter', 'filterName');
        filteredCards = filteredCards.sort((a, b) => {
          let fa = a.card_name.toLowerCase(), fb = b.card_name.toLowerCase();
          if (fa < fb) {
            return -1
          }
          if (fa > fb) {
            return 1
          }
          return 0
        })
      }
      if (this.filterCardRadioButton === 'filterFreq') {
        localStorage.setItem('CardHub_SelectedFilter', 'filterFreq');
        filteredCards = filteredCards.sort((a, b) => {
          return (b.numberOfUses === undefined ? 0 : b.numberOfUses) - (a.numberOfUses === undefined ? 0 : a.numberOfUses);
        });
      }
      return filteredCards;
    }
  },
  methods:{
    filterFavorite(){
      this.filterShowFavorite = !this.filterShowFavorite;
      localStorage.setItem('CardHub_ShowFavorite', this.filterShowFavorite);
    },
    filterByCountry(){
      if(this.selectedCountry === 'Česko'){
        this.selectedCountry = 'Slovensko'
        localStorage.setItem('CardHub_SelectedCountry', this.selectedCountry);
      } else {
        this.selectedCountry = 'Česko'
        localStorage.setItem('CardHub_SelectedCountry', this.selectedCountry);
      }
    },
    logOut(){
      Swal.fire({
        title: 'Odhlásenie',
        html: 'Naozaj sa chceš odhlásiť?',
        icon: "warning",
        showCancelButton: true,
        cancelButtonText: 'Nie',
        confirmButtonText: 'OK',
      }).then((result) => {
        if (result.isConfirmed) {
          this.$axios.get(this.$apiUrl + "api/cardhub/logOut/"+this.systemCodeName.trim().split('#')[0] + "/"+this.systemCodeName.trim().split('#')[1], {
            headers: {
              'Authorization': `SystemCode ${this.systemCodeName}`
            }
          }).then(response => {
            if (response.data.status === 'error') {
              Swal.fire({
                title: 'Chyba',
                html: 'Nepodarilo sa odhlásiť! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ response.data.message,
                icon: "warning",
                confirmButtonText: 'OK',
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.close();
                }
              });
            } else {
              localStorage.removeItem('CardHub_LoginCode');
              localStorage.removeItem('CardHub_MyCards');
              this.$router.push({path: '/'});
            }
          }).catch(err => {
            Swal.fire({
              title: 'Chyba',
              html: 'Nepodarilo sa odhlásiť! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ err.response.data.message,
              icon: "warning",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
          })
        }else{
          Swal.close();
        }
      });
    },
    showOverlay(url, code){
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
    reloadCards(){
      this.$axios.get(this.$apiUrl + "api/cardhub/getCards/"+this.systemCodeName.trim().split('#')[0] + "/"+this.systemCodeName.trim().split('#')[1], {
        headers: {
          'Authorization': `SystemCode ${this.systemCodeName}`
        }
      }).then(response => {
        if (response.data.status === 'error') {
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa obnoviť karty! Pravdepodobne nie si pripojený k internetu. Karty neboli zmenené. \n Chyba: '+ response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
        } else {
          if(!localStorage.getItem('CardHub_MyCards')){
            localStorage.setItem('CardHub_MyCards', JSON.stringify(response.data.message));
          } else {
            const parsed = Object.assign([], JSON.parse(localStorage.getItem('CardHub_MyCards')));
            const result = Object.assign([],  response.data.message);
            let result2 = parsed.map((item, i) => Object.assign({}, item, result[i]));
            localStorage.setItem('CardHub_MyCards', JSON.stringify(result2));
          }
          Swal.fire({
            title: 'Úspech!',
            html: 'Karty obnovené! Počet nových kariet: ' + (response.data.message.length - this.cardsArray.length),
            icon: "success",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
          this.cardsArray = JSON.parse(localStorage.getItem('CardHub_MyCards'));
        }
      }).catch(err => {
        Swal.fire({
          title: 'Chyba',
          html: 'Nepodarilo sa obnoviť karty! Pravdepodobne nie si pripojený k internetu. Karty neboli zmenené. \n Chyba: '+ err.response.data.message,
          icon: "warning",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
      })
    }
  },
  created(){
    document
        .getElementsByTagName('meta')
        .namedItem('viewport')
        .setAttribute('content','width=device-width,initial-scale=1.0,maximum-scale=1.0');
  },
  mounted() {
    this.filterCardRadioButton = localStorage.getItem('CardHub_SelectedFilter') ?? 'filterName';
    this.filterShowFavorite = localStorage.getItem('CardHub_ShowFavorite') ?? false;
    if(this.filterShowFavorite === 'true'){this.filterShowFavorite = true;}
    if(this.filterShowFavorite === 'false'){this.filterShowFavorite = false;}
    this.systemCodeName = localStorage.getItem('CardHub_LoginCode');
    this.selectedCountry = localStorage.getItem('CardHub_SelectedCountry') ?? 'Slovensko';
    this.cardsArray = JSON.parse(localStorage.getItem('CardHub_MyCards'));
  },
}
</script>