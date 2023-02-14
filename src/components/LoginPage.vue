<template>
  <v-app-bar>
    <v-toolbar-title>
      <v-icon icon="mdi-card-search-outline"></v-icon>
      CardHub
    </v-toolbar-title>
  </v-app-bar>
  <v-container class="mt-15">
    <v-row justify="center">
      <v-col cols="12" lg="4" md="4" sm="12">
        <v-card rounded>
          <v-card-title>
            Vlož prihlasovací kód:
          </v-card-title>
          <v-card-text>
            <v-text-field
                placeholder="Kód"
                variant="outlined"
                single-line
                type="text"
                clearable
                active
                id="loginField"
                v-model="enterSystemCode"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn
                color="green"
                append-icon="mdi-login"
                variant="text"
                @click="enterSystem"
            >Prihlásiť sa
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row justify="center" class="mt-15">
      <v-col cols="12" lg="4" md="4" sm="12">
        <v-card rounded>
          <v-card-title>
            Nemáš ešte účet? Vytvor si nový:
          </v-card-title>
          <v-card-text>
            <v-text-field
                placeholder="Vlož svoj vlastný kód..."
                counter="20"
                :rules="registerRules"
                variant="outlined"
                single-line
                type="text"
                :suffix="randomSuffix"
                clearable
                active
                id="registerField"
                v-model="registerCode"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn
                color="green"
                append-icon="mdi-account-plus"
                variant="text"
                @click="createAccount"
            >Vytvoriť účet
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Swal from "sweetalert2";
import {v4 as uuidv4} from 'uuid';
import {FirebasePerformance} from "@capacitor-firebase/performance";

export default {
  name: "LoginPage",
  data() {
    return {
      maxUsersSlider: 1,
      enterSystemCode: "",
      enterSystemAlertMessage: "",
      registerCode: "",
      randomSuffix: "",
      registerRules: [v => v.length <= 20 || 'Najviac 20 znakov'],
    }
  },
  methods: {
    async createAccount() {
      try {
        if (this.registerCode && this.randomSuffix && this.maxUsersSlider) {
          if (this.registerCode.length <= 20 && this.maxUsersSlider <= 20) {
            await FirebasePerformance.startTrace({traceName: 'LoginPage.vue/createAccount'});
            this.$axios.post(this.$apiUrl + "api/cardhub/registerNewAccount/", {
              "registrationCode": this.registerCode + this.randomSuffix,
              "maxUsersLimit": this.maxUsersSlider
            }).then(response => {
              if (response.data.status === 'error') {
                Swal.fire({
                  customClass: {
                    container: 'codeFromImageSwal'
                  },
                  title: 'Chyba',
                  html: 'Chyba: ' + response.data.message,
                  icon: "warning",
                  confirmButtonText: 'OK',
                }).then((result) => {
                  if (result.isConfirmed) {
                    Swal.close();
                  }
                });
              } else {
                this.enterSystemCode = this.registerCode + this.randomSuffix;
                this.registerAlert = true;
                this.registerCode = "";
                this.randomSuffix = "";
                Swal.fire({
                  customClass: {
                    container: 'codeFromImageSwal'
                  },
                  title: 'Úspech',
                  html: 'Účet vytvorený, prihlasujem...',
                  icon: "success",
                });
                this.enterSystem();
              }
            }).catch(async err => {
              Swal.fire({
                customClass: {
                  container: 'codeFromImageSwal'
                },
                title: 'Chyba',
                html: 'Nie si pripojený k internetu!',
                icon: "warning",
                confirmButtonText: 'OK',
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.close();
                }
              });
              await this.addLogMessage('Axios register account = ' + err.message);
              await this.setContext('LoginPage.vue', 'createAccount_method', 'string');
              await this.recordException('No internet access when registering! Axios crash.');
            });
            await FirebasePerformance.stopTrace({traceName: 'LoginPage.vue/createAccount'});
          }
        }
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
        await this.addLogMessage('Register account TryCatch error = ' + e);
        await this.setContext('LoginPage.vue', 'createAccount_method', 'string');
        await this.recordException('Registering account failed in TryCatch. Possible API issue.');
      }
    },
    async enterSystem() {
      try {
        if (this.enterSystemCode) {
          await FirebasePerformance.startTrace({traceName: 'LoginPage.vue/enterSystem'});
          await this.$axios.get(this.$apiUrl + "api/cardhub/enterSystemWithCode/" + this.enterSystemCode.trim().split('#')[0] + "/" + this.enterSystemCode.trim().split('#')[1], {
            headers: {
              'Authorization': `SystemCode ${this.enterSystemCode.trim()}`
            }
          }).then(async response => {
            if (response.data.status === 'error') {
              Swal.fire({
                customClass: {
                  container: 'codeFromImageSwal'
                },
                title: 'Chyba',
                html: 'Chyba: ' + response.data.message,
                icon: "warning",
                confirmButtonText: 'OK',
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.close();
                }
              });
            } else {
              await FirebasePerformance.startTrace({traceName: 'LoginPage.vue/enterSystem/saveLoginCode_SaveCards'});
              localStorage.setItem('CardHub_LoginCode', this.enterSystemCode.trim());
              localStorage.setItem('CardHub_MyCards', JSON.stringify(response.data.message));
              await FirebasePerformance.stopTrace({traceName: 'LoginPage.vue/enterSystem/saveLoginCode_SaveCards'});
              this.$router.push({path: '/moje-karty'});
            }
          }).catch(async err => {
            Swal.fire({
              customClass: {
                container: 'codeFromImageSwal'
              },
              title: 'Chyba',
              html: 'Nie si pripojený k internetu!',
              icon: "warning",
              confirmButtonText: 'OK',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.close();
              }
            });
            await this.addLogMessage('Axios login error = ' + err.message);
            await this.setContext('LoginPage.vue', 'enterSystem_method', 'string');
            await this.recordException('No internet access when logging in! Axios crash.');
          });
          await FirebasePerformance.stopTrace({traceName: 'LoginPage.vue/enterSystem'});
        } else {
          Swal.fire({
            customClass: {
              container: 'codeFromImageSwal'
            },
            title: 'Chyba',
            html: 'Prosím zadaj prihlasovací kód.!',
            icon: "warning",
            confirmButtonText: 'OK',
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.close();
            }
          });
        }
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
        await this.addLogMessage('Login TryCatch error = ' + e);
        await this.setContext('LoginPage.vue', 'enterSystem_method', 'string');
        await this.recordException('Login failed in TryCatch block. Possible API issue.');
      }
    }
  },
  async mounted() {
    await FirebasePerformance.startTrace({traceName: 'LoginPage.vue/uuidv4Time'});
    let uuid = uuidv4();
    this.randomSuffix = "#" + uuid.substring(9, 13).toUpperCase();
    await FirebasePerformance.stopTrace({traceName: 'LoginPage.vue/uuidv4Time'});

    if (this.$route.params.sharedLogin && this.$route.params.code) {
      this.enterSystemCode = this.$route.params.code.trim();
      this.enterSystemAlertMessage = "Prihlasovací kód aplikovaný! Môžeš sa prihlásiť.";
    }
    if (localStorage.getItem('CardHub_LoginCode')) {
      await FirebasePerformance.startTrace({traceName: 'LoginPage.vue/ShowCards.vue/transitionTime'});
      this.$router.push({path: '/moje-karty'});
    }
  },
}
</script>