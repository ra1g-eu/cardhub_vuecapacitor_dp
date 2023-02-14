<template>
  <v-app-bar
      color="black"
      app>
    <v-btn icon="mdi-arrow-left" border="0" @click="this.$router.push({path: '/moje-karty'});"
           variant="outlined"></v-btn>
    <v-toolbar-title class="font-weight-light text-subtitle-1">{{ this.cardName }}
      <v-spacer></v-spacer>
      ({{ this.cardCountry }})
    </v-toolbar-title>
    <v-btn icon="mdi-playlist-edit" border="0" variant="outlined" @click="this.cardEditDialog = true;"></v-btn>
  </v-app-bar>
  <v-main class="elevation-0">
    <v-card class="mt-15 elevation-0" color="yellow-darken-1">
      <v-card-text class="justify-center text-center">
        <div v-if="isShowingQrCode">
          <qrcode-vue :value="this.barcodeCodeToGen" :size="190" background="transparent" level="H"
                      class="justify-center"></qrcode-vue>
        </div>
        <div v-else>
          <vue-barcode class="justify-center" :options="{ displayValue: true, width: 2.3, height: 150 }"
                       tag="svg" :value="this.barcodeCodeToGen">
            Nastala chyba pri generovaní čiarového kódu!
          </vue-barcode>
        </div>
      </v-card-text>
    </v-card>
    <v-btn
        class="mb-16 me-2 rounded-circle "
        @click="this.isShowingQrCode = !this.isShowingQrCode"
        color="black"
        rounded
        height="70"
        width="70"
        fab
        position="fixed"
        location="right bottom"
    >
      <v-icon color="white" size="35">mdi-qrcode</v-icon>
    </v-btn>
  </v-main>


  <v-row justify="center">
    <v-dialog
        v-model="cardNotesDialog"
        fullscreen=""
    >
      <v-card color="black">
        <v-card-title class="text-wrap">Poznámky</v-card-title>
        <v-card-text class="ma-2">
          {{ this.cardNotes }}
        </v-card-text>
        <v-card-actions>
          <v-btn color="white" variant="outlined" block append-icon="mdi-close"
                 @click="this.cardNotesDialog = false;">Zatvoriť
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
  <v-row justify="center">
    <v-dialog
        v-model="cardEditDialog"
        fullscreen=""
    >

      <v-card color="yellow-darken-1">
        <v-card-title class="bg-black pt-6 pb-6">
          <v-row justify="start" align="center">
            <v-btn icon="mdi-arrow-left" border="0" @click="this.cardEditDialog = !this.cardEditDialog"
                   variant="outlined"></v-btn>
            <span class="ms-5 text-subtitle-1">Úprava {{ this.cardName }} ({{ this.cardCountry }})
          </span>
          </v-row>
        </v-card-title>
        <v-card-text>
          <v-card-text>
            <v-textarea
                color="yellow-darken-1"
                v-model="this.cardEditDesc"
                clearable
                name="cardDesc"
                label="Poznámka ku karte"
                :placeholder="this.cardNotes"
                auto-grow
            ></v-textarea>
          </v-card-text>
          <v-card-text v-if="barcodeCodeToGen !== '--'">
            <v-text-field
                color="black"
                class="mt-2"
                name="cardEditCode"
                label="Kód karty"
                variant="outlined"
                single-line
                clearable
                id="cardManualCode"
                v-model="this.cardEditCode"
                :placeholder="this.barcodeCodeToGen"
            ></v-text-field>
          </v-card-text>
        </v-card-text>
        <v-card-actions>
          <v-btn color="green-darken-2" class="text-white" variant="flat" append-icon="mdi-check"
                 @click="editCard(this.cardEditDesc, this.cardEditCode);this.cardEditDialog = false;">Uložiť
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="black" variant="flat" append-icon="mdi-close"
                 @click="this.cardEditDialog = false;">Zrušiť
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
  <v-bottom-navigation
      id="bottomNav2"
      bg-color="black"
      grow>
    <v-btn variant="text" @click="confirmCardDelete">
      <v-icon class="mb-1">mdi-delete</v-icon>
      <span>Vymazať</span>
    </v-btn>
    <v-btn variant="text" @click="redirectToPage()">
      <v-icon class="mb-1">mdi-open-in-new</v-icon>
      <span>Letáky</span>
    </v-btn>
    <v-btn variant="text" @click="showNotes">
      <v-icon class="mb-1">mdi-comment-text-multiple</v-icon>
      <span>Poznámky</span>
    </v-btn>
    <v-btn variant="text" @click="addFavorite(this.cardUuid)">
      <v-icon size="large" class="mb-1">{{ this.cardIsFavorite == true ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
      <span>Obľúbené</span>
    </v-btn>
  </v-bottom-navigation>

</template>

<script>
import VueBarcode from '@chenfengyuan/vue-barcode';
import QrcodeVue from 'qrcode.vue';
import Swal from "sweetalert2";
import {Browser} from '@capacitor/browser';
import {FirebasePerformance} from "@capacitor-firebase/performance";

export default {
  name: "DisplayCard",
  components: {
    'vue-barcode': VueBarcode,
    'qrcode-vue': QrcodeVue,
  },
  data() {
    return {
      isShowingQrCode: true,
      cardEditCode: '',
      cardEditDesc: '',
      barcodeCodeToGen: '',
      cardIsFavorite: false,
      cardShopUrl: '',
      cardUrl: '',
      cardNotes: '',
      cardUuid: '',
      cards: [],
      cardName: '',
      cardCountry: '',
      cardNotesDialog: false,
      cardEditDialog: false,
      systemCodeName: '',
    }
  },
  methods: {
    async editCard() {
      try {
        await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/editCard'});
        await this.$axios.post(this.$apiUrl + "api/cardhub/editCard", {
          "cardUuid": this.cardUuid,
          "cardDesc": this.cardEditDesc,
          "cardManualCode": this.cardEditCode === '' ? this.barcodeCodeToGen : this.cardEditCode
        }, {
          headers: {
            'Authorization': `SystemCode ${this.systemCodeName}`,
            'Content-Type': 'application/json'
          },
        }).then(async response => {
          if (response.data.status === 'error') {
            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Chyba',
              html: 'Nepodarilo sa upraviť kartu! Pravdepodobne nie si pripojený k internetu. \n Chyba: ' + response.data.message,
              icon: "warning",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
          } else {
            this.cards = JSON.parse(localStorage.getItem('CardHub_MyCards'));
            await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/editCard/forLoop_saveEditedCard'});
            for (let i = 0, len = this.cards.length; i < len; i++) {
              if (this.cards[i].card_uuid == this.cardUuid) {
                this.cards[i].manualCode = this.cardEditCode === '' ? this.barcodeCodeToGen : this.cardEditCode;
                this.cards[i].cardNotes = this.cardEditDesc;
              }
            }
            await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/editCard/forLoop_saveEditedCard'});
            localStorage.setItem('CardHub_MyCards', JSON.stringify(this.cards));
            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Úspech',
              html: 'Karta upravená! Aktualizuj zoznam kariet.',
              icon: "success",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
          }
        }).catch(async err => {
          await this.addLogMessage('Axios edit card error = ' + err.message);
          await this.setContext('DisplayCard.vue', 'editCard_method', 'string');
          await this.recordException('Failed to update card! Internet issue.');
          console.log(err);
          Swal.fire({
            customClass: {
              container: 'codeFromImageSwal'
            },
            title: 'Chyba',
            html: 'Nepodarilo sa upraviť kartu! Pravdepodobne nie si pripojený k internetu. \n Chyba: ' + err.response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
        });
        await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/editCard'});
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
        await this.addLogMessage('Edit card error TryCatch = ' + e);
        await this.setContext('DisplayCard.vue', 'editCard_method', 'string');
        await this.recordException('Editing card failed in TryCatch. Possbile API issue.');
      }
    },
    showNotes() {
      if (this.cardNotes.length <= 1) {
        Swal.fire({
          customClass: {
            container: 'codeFromImageSwal'
          },
          title: 'Pozor',
          html: 'Pre túto kartu nie sú vytvorené žiadne poznámky',
          icon: "warning",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
      } else {
        this.cardNotesDialog = true;
      }
    },
    redirectToPage() {
      const openUrlInBrowser = async () => {
        await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/openUrlInBrowser'});
        await Browser.open({url: this.cardShopUrl});
        await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/openUrlInBrowser'});
      };
      if (this.cardShopUrl == 'no_url') {
        Swal.fire({
          customClass: {
            container: 'codeFromImageSwal'
          },
          title: 'Pozor',
          html: 'Pre tento obchod nie je priradená žiadna webstránka!',
          icon: "warning",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
      } else {
        try {
          openUrlInBrowser();
        } catch (e) {
          this.addLogMessage('capacitor/browser plugin error = ' + e);
          this.setContext('DisplayCard.vue', 'redirectToPage_method', 'string');
          this.recordException('Failed to open web page in WebView!');
        }

      }
    },
    async addFavorite(uuid) {
      await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/addFavorite'});
      this.cardsArray = JSON.parse(localStorage.getItem('CardHub_MyCards'));
      await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/addFavorite/forLoop_updateCardFavorite'});
      for (let i = 0, len = this.cardsArray.length; i < len; i++) {
        if (this.cardsArray[i].card_uuid == uuid) {
          if (this.cardsArray[i].isFavorite == true) {
            this.cardIsFavorite = false;
            this.cardsArray[i].isFavorite = false;
          } else {
            this.cardIsFavorite = true;
            this.cardsArray[i].isFavorite = true;
          }
        }
      }
      await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/addFavorite/forLoop_updateCardFavorite'});
      localStorage.setItem('CardHub_MyCards', JSON.stringify(this.cardsArray));
      await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/addFavorite'});
    },
    confirmCardDelete() {
      this.cardEditDialog = false;
      Swal.fire({
        customClass: {
          container: 'codeFromImageSwal'
        },
        title: 'Pozor',
        html: 'Naozaj vymazať kartu ' + this.cardName + ' (' + this.cardCountry + ') ?',
        icon: "warning",
        confirmButtonText: 'OK',
        showCancelButton: true,
        cancelButtonText: 'Zrušiť',
      }).then((result) => {
        if (result.isConfirmed) {
          this.deleteCard();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.close();
        }
      });
    },
    async deleteCard() {
      try {
        await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/deleteCard'});
        await this.$axios.get(this.$apiUrl + "api/cardhub/removeCardWithCode/" + this.systemCodeName.trim().split('#')[0] + "/" + this.systemCodeName.trim().split('#')[1] + "/" + this.cardUuid, {
          headers: {
            'Authorization': `SystemCode ${this.systemCodeName}`
          }
        }).then(response => {
          if (response.data.status === 'error') {
            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Chyba',
              html: 'Nepodarilo sa vymazať kartu! Pravdepodobne nie si pripojený k internetu. Karta nebola ovplyvnená. \n Chyba: ' + response.data.message,
              icon: "warning",
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
              title: 'Úspech!',
              html: 'Karta vymazaná',
              icon: "success",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                this.$router.push({path: '/moje-karty'});
              }
            });
          }
        }).catch(async err => {
          Swal.fire({
            customClass: {
              container: 'codeFromImageSwal'
            },
            title: 'Chyba',
            html: 'Nepodarilo sa vymazať kartu! Pravdepodobne nie si pripojený k internetu. Karta nebola ovplyvnená. \n Chyba: ' + err.response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
          await this.addLogMessage('Axios remove card error = ' + err.message);
          await this.setContext('DisplayCard.vue', 'deleteCard_method', 'string');
          await this.recordException('Failed to remove card from database! Internet issue.');
        });
        await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/deleteCard'});
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
        await this.addLogMessage('Remove card TryCatch error = ' + e);
        await this.setContext('DisplayCard.vue', 'deleteCard_method', 'string');
        await this.recordException('Failed to remove card in TryCatch. Possible API error.');
      }
    },
  },
  async created() {
    await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/created'});
    document
        .getElementsByTagName('meta')
        .namedItem('viewport')
        .setAttribute('content', 'width=device-width,initial-scale=1.0,maximum-scale=2.5');
    this.cards = JSON.parse(localStorage.getItem('CardHub_MyCards'));
    await FirebasePerformance.startTrace({traceName: 'DisplayCard.vue/created/forLoop_loadCard'});
    for (let i = 0, len = this.cards.length; i < len; i++) {
      if (this.cards[i].card_uuid == this.$route.params.id) {
        this.barcodeCodeToGen = this.cards[i].manualCode;
        this.cardUrl = this.cards[i].card_image;
        this.cardUuid = this.cards[i].card_uuid;
        this.cardNotes = this.cards[i].cardNotes;
        this.cardName = this.cards[i].card_name;
        this.cardCountry = this.cards[i].country_name;
        this.cardIsFavorite = this.cards[i].isFavorite;
        this.cardShopUrl = this.cardCountry == 'Slovensko' ? this.cards[i].shopUrlSK : this.cards[i].shopUrlCZ;
        this.cards[i].numberOfUses = this.cards[i].numberOfUses == null ? 1 : parseInt(this.cards[i].numberOfUses) + 1;
      }
    }
    await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/created/forLoop_loadCard'});
    localStorage.setItem('CardHub_MyCards', JSON.stringify(this.cards));
    await FirebasePerformance.stopTrace({traceName: 'DisplayCard.vue/created'});
  },
  mounted() {
    this.systemCodeName = localStorage.getItem('CardHub_LoginCode');
  }
}
</script>

<style scoped>

</style>