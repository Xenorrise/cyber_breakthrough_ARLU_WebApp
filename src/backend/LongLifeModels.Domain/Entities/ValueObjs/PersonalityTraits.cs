namespace LongLifeModels.Domain.Entities;

public class PersonalityTraits
{
	public double Openness { get; }
    public double Conscientiousness { get; }
    public double Extraversion { get; }
    public double Agreeableness { get; }
    public double Neuroticism { get; }

	public PersonalityTraits() { }

	public PersonalityTraits(double openness, double conscientiousness, 
                             double extraversion, double agreeableness, 
                             double neuroticism)
    {
		PersonalityValidation(ref openness, ref conscientiousness,ref extraversion, ref agreeableness, 
                             ref neuroticism);
        Openness = openness;
        Conscientiousness = conscientiousness;
        Extraversion = extraversion;
        Agreeableness = agreeableness;
        Neuroticism = neuroticism;
    }

	private void PersonalityValidation(ref double openness,ref double conscientiousness, 
                             ref double extraversion, ref double agreeableness, 
                             ref double neuroticism)
	{
		openness = openness > 1 ? 1 : openness;
		openness = openness < 0 ? 0 : openness;

		conscientiousness = conscientiousness > 1 ? 1 : conscientiousness;
		conscientiousness = conscientiousness < 0 ? 0 : conscientiousness;

		extraversion = extraversion > 1 ? 1 : extraversion;
		extraversion = extraversion < 0 ? 0 : extraversion;

		agreeableness = agreeableness > 1 ? 1 : agreeableness;
		agreeableness = agreeableness < 0 ? 0 : agreeableness;

		neuroticism = neuroticism > 1 ? 1 : neuroticism;
		neuroticism = neuroticism < 0 ? 0 : neuroticism;
	}

}