# Instructions pour Tester la Suppression des Niveaux en Local

## Étape 1 : Actualiser la Base de Données Locale

Exécuter le script SQL pour nettoyer les dépendances :

```bash
psql -U yassine -d edutrack -f actualiser_suppression_niveaux_local.sql
```

## Étape 2 : Vérifier les Changements

Le script va :
- ✅ Supprimer les progressions de leçons problématiques
- ✅ Supprimer les leçons liées aux chapitres
- ✅ Supprimer les chapitres des niveaux problématiques
- ✅ Supprimer les classes et assignations liées
- ✅ Supprimer les niveaux problématiques (ID 11, 29, 33)
- ✅ Créer 3 nouveaux niveaux de test : TEST_A, TEST_B, TEST_C

## Étape 3 : Tester la Suppression

1. **Connectez-vous à l'interface admin** avec : `admin` / `123456`
2. **Allez dans l'onglet "Niveaux"**
3. **Testez la suppression** des niveaux suivants :
   - **Niveau Test A** (TEST_A)
   - **Niveau Test B** (TEST_B) 
   - **Niveau Test C** (TEST_C)

## Étape 4 : Comportement Attendu

✅ **Suppression Réussie** : 
- Message "Niveau supprimé avec succès"
- Page se recharge automatiquement après 1 seconde
- Niveau disparaît de la liste

❌ **Suppression Échouée** :
- Message d'erreur explicite si le niveau est utilisé
- Niveau reste dans la liste

## Étape 5 : Vérification des Niveaux de Base

Les niveaux de base suivants **ne doivent PAS être supprimés** :
- 1AC, 2AC, 3AC (collège)
- BAC1, BAC2 (lycée)
- Autres niveaux avec des données importantes

## Problèmes Potentiels

Si la suppression ne fonctionne toujours pas :
1. Vérifiez les logs de la console JavaScript
2. Vérifiez les logs du serveur
3. Redémarrez le serveur avec `npm run dev`
4. Vérifiez la connexion à la base de données

## Support

Si vous rencontrez des problèmes, vérifiez :
- La connexion à PostgreSQL
- Les permissions de l'utilisateur `yassine`
- L'existence de la base de données `edutrack`