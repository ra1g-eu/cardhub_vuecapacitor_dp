<template>
  <v-app-bar
      color="black"
      app>
    <v-btn icon="mdi-arrow-left" border="0" @click="this.$router.push({path: '/moje-karty'});"
           variant="outlined"></v-btn>
    <v-toolbar-title class="font-weight-normal text-subtitle-1">Výber obchodu
    </v-toolbar-title>
  </v-app-bar>
  <v-main>
  <v-card color="yellow-darken-1" id="refreshCard" elevation="0" class="h-100 fill-height">

    <v-card-text v-if="this.cardShops != null && !this.isLoading">
      <v-list bg-color="yellow-darken-1">
        <v-list-item
            v-for="(card, index) in cardShops"
            :key="index"
            :value="card"
            active-color="black"
            @click="this.cardShop = {shopId: card.shopId, shopName: card.shopName}; insertShopDetailsDialog = true"
        >
          <template v-slot:prepend>
            <v-avatar class="me-2">
              <v-img
                  :src="card.shopLogo"
                  :alt="card.shopName"
              ></v-img>
            </v-avatar>
          </template>
          <v-list-item-title v-text="card.shopName"></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-text class="d-flex flex-column justify-center" v-else>
      <span class="text-center text-subtitle-1">Žiadne obchody sa nenašli! Potiahni dole pre obnovenie.</span>
      <v-card v-if="isLoading" class="justify-center align-center fill-height d-flex flex-column" color="yellow-darken-1">
        <v-progress-circular
            :size="65"
            width="5"
            indeterminate
            color="black"
        ></v-progress-circular>
        <v-card-subtitle class="mt-5 text-black">Načítavam obchody...</v-card-subtitle>
      </v-card>

    </v-card-text>
  </v-card>
  </v-main>
    <v-dialog
      v-model="insertShopDetailsDialog"
      persistent
      fullscreen=""
      transition="dialog-bottom-transition"
  >
    <v-card color="yellow-darken-1">
      <v-card-title class="bg-black pt-6 pb-6">
        <v-row justify="start" align="center">
          <v-btn icon="mdi-arrow-left" border="0" @click="insertShopDetailsDialog=false;"
                 variant="outlined"></v-btn>
          <span class="ms-5">{{ this.cardShop.shopName }}
          </span>
        </v-row>
      </v-card-title>
      <v-card-title></v-card-title>
      <v-card-text class="mb-0">
        <v-select
            label="Krajina pre kartu"
            variant="outlined"
            v-model="cardSelectedCountry"
            :items="cardCountry"
        ></v-select>
        <v-textarea
            density="comfortable"
            color="black"
            v-model="cardDesc"
            clearable
            name="cardDesc"
            label="Poznámka ku karte"
            auto-grow
        ></v-textarea>
      </v-card-text>
      <v-card-title>3 možnosti vloženia karty</v-card-title>
      <v-card-text>
        <v-row justify="center" no-gutters="" align="center">
          <v-col cols="6">
            <v-card class="ma-1" color="black">
              <div class="text-h6 font-weight-light align-center text-center text-primary" @click="startScan">
                <v-icon>mdi-camera</v-icon>
                <v-spacer></v-spacer>
                Naskenovať čiarový kód
              </div>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card class="ma-1 border border-secondary border-2" color="black">
              <div class="text-h6 font-weight-light align-center text-center text-secondary"
                   @click="this.$refs.cardImgInput.click()">
                <v-icon>{{ this.cardManualCode.length > 0 ? 'mdi-check' : 'mdi-file' }}</v-icon>
                <v-spacer></v-spacer>
                {{ this.cardManualCode.length > 0 ? 'Obrázok zvolený' : 'Nahrať obrázok karty' }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-text-field
                color="black"
                class="mt-2"
                name="cardManualCode"
                label="Manuálne vložiť číslo karty"
                variant="outlined"
                single-line
                clearable
                id="cardManualCode"
                v-model="cardManualCode"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="flat" block append-icon="mdi-check" type="button" @click="addNewCard" color="black"><span
            class="text-green">Uložiť</span></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-file-input
      ref="cardImgInput"
      class="d-none"
      :rules="rules"
      v-model="cardImage"
      accept="image/png, image/jpeg, image/bmp"
      placeholder="Vyber obrázok karty"
      prepend-inner-icon="mdi-camera"
      prepend-icon
      label="Obrázok karty"
      @change="codeFromImageLoaded"
  ></v-file-input>
  <div class="d-none" id="reader"></div>
  <v-btn id="scanBtn" icon="mdi-close" size="large" @click="stopScan" class="text-center"></v-btn>
</template>

<script>
/* eslint-disable */
import {BarcodeScanner} from "@capacitor-community/barcode-scanner";
import Swal from "sweetalert2";
import {Html5Qrcode} from "html5-qrcode";
import PullToRefresh from 'pulltorefreshjs';

export default {
  name: "NewCard",
  data() {
    return {
      rules: [
        value => {
          return !value || !value.length || value[0].size < 5000000 || 'Obrázok nemôže byť väčší ako 5 MB!'
        },
      ],
      insertShopDetailsDialog: false,
      cardShop: {shopId: '1', shopName: 'Všeobecný obchod'},
      cardShops: null,
      cardManualCode: '',
      snackBarColor: 'text-red',
      cardCountry: ['Slovensko', 'Česko'],
      cardSelectedCountry: '',
      cardImage: [],
      cardDesc: '',
      snackbar: false,
      snackBarText: '',
      systemCodeName: '',
      isLoading: false,
    }
  },
  mounted() {
    this.systemCodeName = localStorage.getItem('CardHub_LoginCode');
    document.getElementById("scanBtn").style.display = 'none';
    let _this = this;
    PullToRefresh.init({
      instructionsPullToRefresh: 'Potiahni dole pre obnovu obchodov',
      instructionsReleaseToRefresh: 'Uvoľni pre obnovenie obchodov',
      instructionsRefreshing: 'Obnovujem...',
      distReload: 110,
      distMax: 90,
      distThreshold: 80,
      mainElement: '#refreshCard',
      onRefresh() {
        _this.getShops();
      }
    });
    //this.isLoading = true;
    //this.getShops();
    this.cardShops = JSON.parse(localStorage.getItem('CardHub_CurrentShops'));
    //console.log(this.cardShops);
  },
  methods: {
    codeFromImageLoaded(){
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCode.scanFile(this.cardImage[0], false)
          .then(decodedText => {
            this.cardManualCode = decodedText;
            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Úspech',
              html: 'Kód ' + decodedText + ' z obrázku bol načítaný! Prosím skontroluj kód. Ak je nesprávny, vlož ho manuálne alebo ho naskenuj cez kameru.',
              icon: "success",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
          })
          .catch(async err => {
            console.log(err);
            await this.addLogMessage('Html5Qrcode error = ' + err.toString());
            await this.setContext('NewCard.vue', 'codeFromImageLoaded_method', 'string');
            await this.recordException('Failed to read code from image!');
            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Pozor',
              html: 'Problém s naskenovaním kódu. Vlož kód manuálne alebo opakuj akciu.',
              icon: "warning",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
          });
    },
    stopScan() {
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
      document.getElementById('htmlTag').hidden = false; //hide camera to show webview
      document.getElementById("scanBtn").style.display = 'none';
      document.getElementById("scanBtn").hidden = true;
    },
    async startScan() {
      try {
        const status = await BarcodeScanner.checkPermission({force: true});

        if (status.granted) {
          document.getElementById('htmlTag').hidden = true; //hide webview to show camera

          await BarcodeScanner.hideBackground();
          document.getElementById("scanBtn").style.display = '';
          document.getElementById("scanBtn").hidden = false;

          const result = await BarcodeScanner.startScan();


          if (result.hasContent) {
            if (result.content.length > 2 && /^[0-9]+$/.test(result.content)) {
              document.getElementById('htmlTag').hidden = false; //hide camera to show webview
              document.getElementById("scanBtn").style.display = 'none';
              document.getElementById("scanBtn").hidden = true;
              this.cardManualCode = result.content;
              Swal.fire({
                customClass: {
                  container: 'codeFromImageSwal'
                },
                title: 'Úspech',
                html: 'Kód ' + this.cardManualCode + ' z karty bol načítaný! Prosím skontroluj kód. Ak je nesprávny, vlož ho manuálne alebo nahraj obrázok.',
                icon: "success",
                confirmButtonText: 'OK',
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.close();
                }
              });
            } else {
              Swal.fire({
                customClass: {
                  container: 'codeFromImageSwal'
                },
                title: 'Chyba',
                html: 'Kód ' + this.cardManualCode + ' z karty nie je správny! Vlož kód manuálne alebo nahraj obrázok.',
                icon: "warning",
                confirmButtonText: 'OK',
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.close();
                }
              });
            }
          }
        } else {
          Swal.fire({
            customClass: {
              container: 'codeFromImageSwal'
            },
            title: 'Chyba',
            html: 'Povolenie na použitie fotoaparátu nebolo udelené!',
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
        }
      } catch (e) {
        await this.addLogMessage('Device camera error = ' + e.toString());
        await this.setContext('NewCard.vue', 'startScan_method', 'string');
        await this.recordException('Failed to scan QR code with device camera!');
      }
    },
    getShops() {
      this.isLoading = true;
      this.$axios.get(this.$apiUrl + "api/cardhub/getShops/", {
        headers: {
          'Authorization': `SystemCode ${this.systemCodeName}`
        }
      }).then(response => {
        if (response.data.status === 'error') {
          this.isLoading = false;
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa načítať obchody! Pravdepodobne nie si pripojený k internetu. \n Chyba: ' + response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              this.$router.push({path: '/moje-karty'});
            }
          });
        } else {
          localStorage.setItem('CardHub_CurrentShops', JSON.stringify(response.data.message));
          setTimeout(() => this.isLoading = false, Math.floor(Math.random() * 300));
          this.cardShops = JSON.parse(localStorage.getItem('CardHub_CurrentShops'));
          this.isLoading = false;
          Swal.fire({
            title: 'Úspech',
            html: 'Obchody načítané!',
            icon: "success",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
        }
      }).catch(async err => {
        await this.addLogMessage('Axios getShops error = ' + err.message);
        await this.setContext('NewCard.vue', 'getShops_method', 'string');
        await this.recordException('Failed to download new shops from database! Internet issue.');
        this.isLoading = false;
        if (!localStorage.getItem('CardHub_CurrentShops')) {
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa načítať nové obchody! Pravdepodobne nie si pripojený k internetu. \n Chyba: ' + err.response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              this.$router.push({path: '/moje-karty'});
            }
          });
        }
      });
    },
    addNewCard() {
      event.preventDefault();
      let formData = new FormData();
      if(this.cardSelectedCountry){
        if(this.cardManualCode != ''){ // naskenovany kod
          formData.append('cardName', this.cardShop.shopName + ' karta');
          formData.append('cardCountry', this.cardSelectedCountry);
          formData.append('shopId', this.cardShop.shopId);
          formData.append('cardDesc', this.cardDesc);
          formData.append('cardManualCode', this.cardManualCode);
        } /*else if(this.cardManualCode == ''){ // nahraty obrazok
          if(this.cardImage[0].size < 5000000) {
            if (this.cardImage[0].type === 'image/jpeg' || this.cardImage[0].type === 'image/jpg' || this.cardImage[0].type === 'image/png') {
              formData.append('file', this.cardImage[0], this.systemCodeName+'_'+this.cardShop.shopName.replaceAll(' ','').toLowerCase().trim()+'_'+this.cardSelectedCountry.toLowerCase().trim()+'_'+this.cardImage[0].name);
              formData.append('cardName', this.cardShop.shopName + ' karta');
              formData.append('cardCountry', this.cardSelectedCountry);
              formData.append('shopId', this.cardShop.shopId);
              formData.append('cardDesc', this.cardDesc);
              formData.append('cardManualCode', '--');
            }
          }
        }*/
        this.$axios.post(this.$apiUrl + "api/cardhub/uploadCardWithCode/",formData,{
          headers: {
            'Authorization': `SystemCode ${this.systemCodeName}`,
            'Content-Type': 'multipart/form-data'
          },
        }).then(response => {
          if (response.data.status === 'error') {
            Swal.fire({
              title: 'Chyba',
              html: 'Nepodarilo sa vytvoriť kartu! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ response.data.message,
              icon: "warning",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                this.$router.push({path: '/moje-karty'});
              }
            });
          } else {
            this.cardSelectedCountry = '';
            this.cardImage = [];
            this.cardDesc = '';
            this.cardManualCode = '';
            this.reloadCards();
            this.insertShopDetailsDialog = false;
            Swal.fire({
              title: 'Úspech',
              html: 'Karta vytvorená!',
              icon: "success",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                this.$router.push({path: '/moje-karty'});
              }
            });
          }
        }).catch(async err => {
          await this.addLogMessage('Axios add new card error = ' + err.message);
          await this.setContext('NewCard.vue', 'addNewCard_method', 'string');
          await this.recordException('Failed to upload new card to database! Internet issue.');
          console.log(err);
          this.cardSelectedCountry = '';
          this.cardImage = [];
          this.cardDesc = '';
          this.addCardDialog = false;
          this.cardManualCode = '';
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa vytvoriť kartu! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ err.response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              this.$router.push({path: '/moje-karty'});
            }
          });
        });
      }
      this.cardSelectedCountry = '';
      this.cardImage = [];
      this.cardDesc = '';
      this.cardManualCode = '';
    },
    reloadCards() {
      this.$axios.get(this.$apiUrl + "api/cardhub/getCards/" + this.systemCodeName.trim().split('#')[0] + "/" + this.systemCodeName.trim().split('#')[1], {
        headers: {
          'Authorization': `SystemCode ${this.systemCodeName}`
        }
      }).then(response => {
        if (response.data.status === 'error') {
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa obnoviť karty! Pravdepodobne nie si pripojený k internetu. Karty neboli zmenené. \n Chyba: ' + response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              this.$router.push({path: '/moje-karty'});
            }
          });
        } else {
          localStorage.setItem('CardHub_MyCards', JSON.stringify(response.data.message));
        }
      }).catch(async err => {
        await this.addLogMessage('Axios reload cards error = ' + err.message);
        await this.setContext('NewCard.vue', 'reloadCards_method', 'string');
        await this.recordException('Failed to reload cards from database! Internet issue.');
      });
    }
  },
  beforeUnmount() {
    PullToRefresh.destroyAll();
    this.stopScan();
  },
  deactivated() {
    this.stopScan();
  },
  beforeDestroy() {
    this.stopScan();
  },
}
</script>

<style scoped>

</style>