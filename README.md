# Raphamaths — Version 0.1

Une application pédagogique **React + TypeScript + Vite + Supabase**, conçue pour apprendre les mathématiques en commençant par le concret, puis en passant au dessin et enfin au calcul abstrait.

> **Statut : prototype fonctionnel, pas encore validé pédagogiquement**. Les activités CM2 sont accompagnées d'exercices de prérequis CE2/CM1. L'application ne remplace pas les enseignants ni les professionnels qui suivent l'enfant.

## Ce qui fonctionne

- Page d'accueil avec mission du jour recommandée selon les prérequis, tentatives précédentes et révisions à refaire.
- 12 compétences réparties en numération, calcul, fractions, mesures, problèmes et lecture de données.
- Exercices générés, réponses vérifiées et explications contextualisées.
- Trois modes pour chaque exercice : **Manipuler**, **Observer**, **Sans aide**.
- Trois ateliers interactifs : blocs base 10, fractions chocolat, tableaux de multiplication.
- Historique sauvegardé après chaque validation, courbes de progression individuelles et barres par domaine. Export CSV manuel depuis la page Progression.
- Mode **Démo locale** (aucune configuration requise), sauvegardé dans le `localStorage` de ce navigateur.
- Mode **Supabase** avec authentification par mot de passe et politiques RLS pour **un seul compte autorisé**.
- Interface responsive, accessible au clavier, sans chronomètre imposé ; option agrandir les textes.

## 1. Lancer l'application immédiatement (démo)

Prérequis : Node.js 22+ et npm.

```bash
npm install
npm run dev
```

Ouvre l'adresse annoncée par Vite (généralement `http://localhost:5173`). **Sans fichier `.env.local`, la démo locale fonctionne immédiatement.** Les données de démonstration sont enregistrées localement dans ce navigateur, et ne sont pas synchronisées entre appareils.

Pour tester la compilation :

```bash
npm run build
```

## 2. Créer un projet Supabase

Le compte Supabase (sur le site) est un compte **administrateur**. Il te faut **aussi créer un projet**, et à l'intérieur, un compte **utilisateur Auth** distinct pour l'application.

1. Dashboard Supabase → **New project**. Choisis un nom et crée le projet.
2. Projet → **SQL Editor** → **New query** : colle le contenu de `supabase/001_init.sql`, puis exécute-le.
3. Projet → **Authentication → Users** : crée **un seul utilisateur** en renseignant **son email et un nouveau mot de passe fort**. Selon l'interface, l'action s'appelle `Add user` puis `Create new user`. Coche la confirmation d'email si la création admin le propose, ou termine la confirmation via l'email.
4. Copie l'**UID** UUID de cet utilisateur (ce n'est pas un ID de projet).
5. Dans **SQL Editor**, exécute en remplaçant l'UUID :

```sql
insert into public.app_access (user_id)
values ('COLLE_ICI_LE_UUID_DE_L_UTILISATEUR_AUTH')
on conflict do nothing;
```

6. Dans **Authentication → Sign In / Providers**, désactive **Allow new users to sign up**. Vérifie aussi que les autres moyens de créer un nouveau compte non désiré sont désactivés. Supabase Auth reste responsable du hachage du mot de passe ; ne crée **pas** ta propre table de mots de passe.

### Clé publique et variables d'environnement

1. Copie `.env.example` vers `.env.local`.
2. Dans **Project Settings / Connect / API Keys** (intitulés variables selon la version du Dashboard), récupère l'**URL de projet** et la clé **publishable** (ou l'ancienne `anon` publique), **jamais la clé `service_role` ou une clé `secret`**.
3. Renseigne les valeurs suivantes :

```dotenv
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
VITE_APP_LOGIN_EMAIL=email-du-compte-auth@example.com
VITE_APP_LOGIN_USERNAME=Raph2pl
```

4. Redémarre le serveur Vite après la modification : `npm run dev`.

L'écran de connexion n'affiche **que le pseudonyme** et le mot de passe. Techniquement, Supabase Auth connecte ce compte par **email + mot de passe** ; le client React traduit le pseudonyme en l'email configuré ci-dessus. **L'email et la clé publiable apparaissent dans le bundle frontend : ils ne sont pas des secrets.** C'est la session Auth et la **RLS**, pas le pseudonyme, qui protègent les données. Le mot de passe n'est jamais stocké dans React, `.env.local` ou notre base de données applicative.

> IMPORTANT : n'utilise pas le mot de passe mentionné précédemment dans une conversation. Change-le pour un mot de passe inédit. Ne publie jamais `.env.local` ni de clé privée.

### Vérifier la sécurité

- Sans session Auth, la lecture et l'insertion dans `attempts` sont interdites.
- Avec une session Auth **qui ne figure pas dans** `app_access`, la lecture/insertion est interdite par RLS.
- Les tentatives sont **append-only** côté utilisateur : pas de suppression/modification directe depuis l'application.
- Si un utilisateur créé dans Supabase Auth ne dispose pas d'une ligne dans `app_access`, l'application refuse la connexion après authentification.
- Chaque tentative stocke l'UID Auth automatiquement via `default auth.uid()` ; le navigateur n'envoie pas une identité arbitraire.

### Sauvegardes et confidentialité

Les données de progression d'une mineure doivent être traitées avec prudence. Ici, aucun nom de famille, adresse ou diagnostic n'est requis ; seul le compte Auth et l'historique des réponses sont conservés. Vérifie les paramètres Supabase et les conditions de protection des données, et planifie un **export régulier** des données (CSV depuis la table `attempts`, ou export de base) : le projet propose un export CSV sur la page Progression, mais n'intègre pas encore de sauvegarde automatique. En cas de fermeture du navigateur, les tentatives déjà synchronisées restent dans Supabase, mais une tentative dont l'enregistrement a échoué **n'est pas marquée comme sauvegardée**.

## 3. Structure du code

```text
src/
  App.tsx                     pages et connexion
  components/
    VisualAid.tsx             visuels et ateliers interactifs
    ProgressCharts.tsx        courbes et pourcentages de domaines
  data/
    curriculum.ts             compétences + prérequis
  lib/
    exercises.ts              générateurs et vérification
    learning.ts               acquisition et recommandations
    supabase.ts               session, lecture/écriture des tentatives
  styles.css                  interface responsive
supabase/
  001_init.sql                tables, index, politiques RLS
```

## 4. Algorithme de progression

L'échelle 0–4 est un **outil interne à l'application**, pas une notation officielle de l'Éducation nationale :

- 0 : pas encore de réussite sans indice en mode Manipuler.
- 1 : réussite sans indice en mode Manipuler.
- 2 : réussite sans indice en modes Manipuler **et** Observer.
- 3 : réussite sans indice dans les trois modes.
- 4 : deux réussites en mode Sans aide espacées d'au moins 24 h, après validation des modes précédents.

Les erreurs ne suppriment pas les niveaux historiquement acquis. Les exercices anciens sont pris en compte par la recommandation. Les graphiques se mettent à jour après la confirmation d'enregistrement. La révision espacée est volontairement simple dans la V0.1.

## 5. Limites connues et V0.2

- L'application contient **12 compétences de départ**, pas tout le référentiel CM2. Certaines compétences reprennent des prérequis CE2 et CM1. Les autres contenus seront ajoutés progressivement.
- L'algorithme ne prétend pas diagnostiquer des troubles ou établir une maîtrise scolaire officielle.
- L'atelier des fractions conserve un curseur de départ et un coloriage local ; ce sont deux supports d'exploration, pas une évaluation notée.
- Les exercices ont des valeurs aléatoires mais sont issus de modèles prédéfinis ; pas d'IA générative dans la boucle d'évaluation.
- Pas d'espace parental séparé dans cette version : le seul compte accède aux courbes.
- À venir : tests unitaires sur les notions, contenu gradué plus riche, audios des consignes, nouvelles représentations visuelles, profils d'aide adaptés, export des résultats, géométrie et programme complet.

## Références techniques

- [Supabase Auth : signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase : gestion des inscriptions](https://supabase.com/docs/guides/auth/general-configuration)
- [Supabase : Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vite](https://vite.dev/guide/)
