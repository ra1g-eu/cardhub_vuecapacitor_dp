<template>
  <v-card v-if="isLoading" class="justify-center align-center fill-height d-flex flex-column" color="yellow-darken-1">
        <v-progress-circular
            :size="65"
            width="5"
            indeterminate
            color="black"
        ></v-progress-circular>
    <v-card-subtitle class="mt-5 text-black">Načítavam obchody...</v-card-subtitle>
  </v-card>
  <v-card v-else color="yellow-darken-1">
    <v-card-title>
      <v-row align="center" dense="" no-gutters="">
        <v-btn variant="flat" icon="mdi-arrow-left" color="black" @click="this.$router.push({path: '/moje-karty'});"></v-btn>
        <span class="ms-4">Výber obchodu</span></v-row>
    </v-card-title>
      <v-card-text>
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
    </v-card>
  <v-dialog
      v-model="insertShopDetailsDialog"
      persistent
      fullscreen=""
      transition="dialog-bottom-transition"
  >
    <v-card color="yellow-darken-1">
      <v-card-title>
        <v-row align="center" dense="" no-gutters="">
          <v-btn variant="flat" icon="mdi-arrow-left" color="black" @click="insertShopDetailsDialog=false;"></v-btn>
          <span class="ms-4"><span class="text-indigo-darken-4">{{this.cardShop.shopName}}</span></span></v-row>
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
                <v-spacer></v-spacer>Naskenovať čiarový kód
              </div>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card class="ma-1 border border-secondary border-2" color="black">
              <div class="text-h6 font-weight-light align-center text-center text-secondary" @click="this.$refs.cardImgInput.click()">
                <v-icon>{{ this.cardImage.length > 0 ? 'mdi-check' : 'mdi-file' }}</v-icon>
                <v-spacer></v-spacer>
                {{ this.cardImage.length > 0 ? 'Obrázok zvolený' : 'Nahrať obrázok karty' }}
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
        <v-btn variant="flat" block append-icon="mdi-check"  type="button" @click="addNewCard" color="black"><span class="text-green">Uložiť</span></v-btn>
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
  ></v-file-input>
  <img class="d-none" id="curImage" height="200" size="" src="" alt="xd">
  <v-btn id="scanBtn" icon="mdi-close" @click="stopScan" class="text-center"></v-btn>
</template>

<script>
import {BarcodeScanner} from "@capacitor-community/barcode-scanner";
import Swal from "sweetalert2";
import QrcodeDecoder from "qrcode-decoder";
export default {
  name: "NewCard",
  data(){
    return{
      rules: [
        value => {
          return !value || !value.length || value[0].size < 5000000 || 'Obrázok nemôže byť väčší ako 5 MB!'
        },
      ],
      insertShopDetailsDialog: false,
      cardShop: {shopId: '1', shopName: 'Všeobecný obchod'},
      cardShops: [],
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
    this.isLoading = true;
    this.getShops();
    this.cardShops = JSON.parse(localStorage.getItem('CardHub_CurrentShops'));
    console.log(this.cardShops);
  },
  methods:{
    stopScan() {
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
      document.getElementById('htmlTag').hidden = false; //hide camera to show webview
      document.getElementById("scanBtn").style.display = 'none';
      document.getElementById("scanBtn").hidden = true;
    },
    async startScan() {
      document.getElementById('htmlTag').hidden = true; //hide webview to show camera
      document.getElementById("scanBtn").style.display = '';
      document.getElementById("scanBtn").hidden = false;

      await BarcodeScanner.hideBackground(); // make background of WebView transparent
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (status.granted) {
        const result = await BarcodeScanner.startScan();

        document.getElementById('htmlTag').hidden = false; //hide camera to show webview
        document.getElementById("scanBtn").style.display = 'none';
        document.getElementById("scanBtn").hidden = true;

        if (result.hasContent) {
          if(result.content.length > 2 && /^[0-9]+$/.test(result.content)){
            this.cardManualCode = result.content;
            Swal.fire({
              title: 'Úspech',
              html: 'Kód '+this.cardManualCode+' z karty bol načítaný! Prosím skontroluj kód. Ak je nesprávny, vlož ho manuálne alebo nahraj obrázok.',
              icon: "success",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
          } else {
            Swal.fire({
              title: 'Chyba',
              html: 'Kód '+this.cardManualCode+' z karty nie je správny! Vlož kód manuálne alebo nahraj obrázok.',
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
    },
    getShops(){
      this.$axios.get(this.$apiUrl + "api/cardhub/getShops/", {
        headers: {
          'Authorization': `SystemCode ${this.systemCodeName}`
        }
      }).then(response => {
        if (response.data.status === 'error') {
          this.isLoading = false;
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa načítať obchody! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ response.data.message,
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
        }
      }).catch(err => {
        this.isLoading = false;
        if(!localStorage.getItem('CardHub_CurrentShops')){
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa načítať nové obchody! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ err.response.data.message,
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
    addNewCard(){
      /* eslint-disable */
      var reader2 = new FileReader();
      reader2.readAsDataURL(this.cardImage[0]);
      reader2.onloadend = function(event) {
        document.getElementById("curImage").src = event.target.result;

      };
      const qr = new QrcodeDecoder();
      qr.decodeFromImage(document.querySelector("#curImage")).then((res) => {
        console.log(res);
      });
      /*e.preventDefault();
      let formData = new FormData();
      if(this.cardSelectedCountry){
        if(this.cardManualCode != ''){ // naskenovany kod
          formData.append('cardName', this.cardShop.shopName + ' karta');
          formData.append('cardCountry', this.cardSelectedCountry);
          formData.append('shopId', this.cardShop.shopId);
          formData.append('cardDesc', this.cardDesc);
          formData.append('cardManualCode', this.cardManualCode);
        } else if(this.cardManualCode == ''){ // nahraty obrazok
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
        }
        console.log('xdddd'+typeof this.cardShop.shopId);
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
        }).catch(err => {
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
      */
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
              this.$router.push({path: '/moje-karty'});
            }
          });
        } else {
          localStorage.setItem('CardHub_MyCards', JSON.stringify(response.data.message));
        }
      });
    }
  }
}
</script>

<style scoped>

</style>