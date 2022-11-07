<template>
  <v-card class="fill-height d-flex flex-column mb-10" color="yellow-darken-1">
    <v-card-title>
      <v-row align="center" dense="" no-gutters="">
        <v-btn variant="flat" icon="mdi-arrow-left" color="black" @click="this.$router.push({path: '/moje-karty'});"></v-btn>
        <span class="ms-4">{{ this.cardName }}<span
            class="font-weight-light text-subtitle-2"> ({{ this.cardCountry }})</span></span></v-row>
    </v-card-title>
    <v-card-text class="justify-center text-center">
      <vue-barcode v-if="this.barcodeCodeToGen != '--'" class="justify-center" :options="{ displayValue: true }"
                   tag="svg" :value="this.barcodeCodeToGen">
        Nastala chyba pri generovaní čiarového kódu!
      </vue-barcode>
      <v-img v-else class="mb-5 mt-0" :src="this.cardUrl">
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular
                :size="65"
                width="5"
                indeterminate
                color="black"
            ></v-progress-circular>
          </div>
        </template>
      </v-img>
    </v-card-text>
  </v-card>
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
      <v-card color="black">
        <v-card-title>
          <v-row justify="space-between" no-gutters="" align="center">
            <v-col cols="11">
              <v-card-title class="text-wrap text-start"><span class="text-yellow-darken-1">{{ this.cardName }}<span
                  class="font-weight-light text-subtitle-2"> ({{ this.cardCountry }})</span></span></v-card-title>
            </v-col>
            <v-col cols="1">
              <v-icon icon="mdi-delete" @click="confirmCardDelete" color="red" class="v-btn--elevated"></v-icon>
            </v-col>
          </v-row>
        </v-card-title>
        <v-card-text>
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
        </v-card-text>
        <v-card-actions>
          <v-btn color="white" variant="outlined" append-icon="mdi-close"
                 @click="this.cardEditDialog = false;">Zrušiť
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="yellow-darken-1" variant="outlined" append-icon="mdi-check"
                 @click="editCard(this.cardEditDesc, this.cardEditCode);this.cardEditDialog = false;">Uložiť
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
  <v-bottom-navigation
      id="bottomNav2"
      bg-color="black"
      grow>
    <v-btn variant="text" @click="this.cardEditDialog = true;">
      <span>Upraviť</span>
      <v-icon>mdi-cog</v-icon>
    </v-btn>
    <v-btn variant="text" @click="redirectToPage()">
      <span>Letáky</span>
      <v-icon>mdi-open-in-new</v-icon>
    </v-btn>
    <v-btn variant="text" @click="showNotes">
      <span>Poznámky</span>
      <v-icon>mdi-comment-text-multiple</v-icon>
    </v-btn>
    <v-btn variant="text" @click="addFavorite(this.cardUuid)">
      <span>Obľúbené</span>
      <v-icon size="large">{{ this.cardIsFavorite == true ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

<script>
import VueBarcode from '@chenfengyuan/vue-barcode';
import Swal from "sweetalert2";
import {Browser} from '@capacitor/browser';

export default {
  name: "DisplayCard",
  components: {
    'vue-barcode': VueBarcode
  },
  data() {
    return {
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
    editCard(){
      this.$axios.post(this.$apiUrl + "api/cardhub/editCard",{"cardUuid":this.cardUuid, "cardDesc": this.cardEditDesc, "cardManualCode":this.cardEditCode},{
        headers: {
          'Authorization': `SystemCode ${this.systemCodeName}`,
          'Content-Type': 'application/json'
        },
      }).then(response => {
        if (response.data.status === 'error') {
          Swal.fire({
            title: 'Chyba',
            html: 'Nepodarilo sa upraviť kartu! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ response.data.message,
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
        } else {
          Swal.fire({
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
      }).catch(err => {
        console.log(err);
        Swal.fire({
          title: 'Chyba',
          html: 'Nepodarilo sa upraviť kartu! Pravdepodobne nie si pripojený k internetu. \n Chyba: '+ err.response.data.message,
          icon: "warning",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
      });
    },
    showNotes() {
      if (this.cardNotes.length <= 1) {
        Swal.fire({
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
        await Browser.open({url: this.cardShopUrl});
      };
      if (this.cardShopUrl == 'no_url') {
        Swal.fire({
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
        openUrlInBrowser();
      }
    },
    addFavorite(uuid) {
      this.cardsArray = JSON.parse(localStorage.getItem('CardHub_MyCards'));
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
      localStorage.setItem('CardHub_MyCards', JSON.stringify(this.cardsArray));
    },
    confirmCardDelete() {
      this.cardEditDialog = false;
      Swal.fire({
        title: 'Info',
        html: 'Naozaj vymazať kartu ' + this.cardName + ' (' + this.cardCountry + ') ?',
        icon: "info",
        confirmButtonText: 'OK',
        showCancelButton: true,
        cancelButtonText: 'Zrušiť',
      }).then((result) => {
        if (result.isConfirmed) {
          this.deleteCard();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.close();
          this.cardEditDialog = true;
        }
      });
    },
    deleteCard() {
      this.$axios.get(this.$apiUrl + "api/cardhub/removeCardWithCode/" + this.systemCodeName.trim().split('#')[0] + "/" + this.systemCodeName.trim().split('#')[1] + "/" + this.cardUuid, {
        headers: {
          'Authorization': `SystemCode ${this.systemCodeName}`
        }
      }).then(response => {
        if (response.data.status === 'error') {
          Swal.fire({
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
      }).catch(err => {
        Swal.fire({
          title: 'Chyba',
          html: 'Nepodarilo sa vymazať kartu! Pravdepodobne nie si pripojený k internetu. Karta nebola ovplyvnená. \n Chyba: ' + err.response.data.message,
          icon: "warning",
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close();
          }
        });
      });
    },
  },
  created() {
    document
        .getElementsByTagName('meta')
        .namedItem('viewport')
        .setAttribute('content', 'width=device-width,initial-scale=1.0,maximum-scale=2.5');
    this.cards = JSON.parse(localStorage.getItem('CardHub_MyCards'));
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
    localStorage.setItem('CardHub_MyCards', JSON.stringify(this.cards));
  },
  mounted() {
    this.systemCodeName = localStorage.getItem('CardHub_LoginCode');
  }
}
</script>

<style scoped>

</style>